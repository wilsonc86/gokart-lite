import json
import demjson
import hashlib
import re
import uwsgi
import base64
import os
import traceback
import sys

import bottle

from .settings import (BASE_PATH,BASE_DIST_PATH,DIST_PATH,ENV_TYPE,PERTH_TIMEZONE,DIST_TYPE)

# serve up map apps
profile_re = re.compile("gokartProfile\s*=\s*(?P<profile>\{.+\})\s*;?\s*exports.+default.+gokartProfile",re.DOTALL)
def _get_profile(app):
    #get app profile
    profile = None
    appPath = os.path.join(DIST_PATH,"{}.js".format(app))
    if not os.path.exists(appPath):
        appPath = os.path.join(DIST_PATH,"sss.js")

    key = "{}_profile".format(app)
    profileChanged = False
    
    if uwsgi.cache_exists(key):
        profile = uwsgi.cache_get(key)
    
    if profile:
        profile = json.loads(profile)
        if repr(os.path.getmtime(appPath)) != profile["mtime"] or os.path.getsize(appPath) != profile["size"]:
            profileChanged = True
            profile = None

    if not profile:
        file_data = None
        with open(appPath,"rb") as f:
            file_data = f.read()
        m = profile_re.search(file_data)
        profile = m.group("profile") if m else "{}"
        profile = {
            'mtime':repr(os.path.getmtime(appPath)),
            'size':os.path.getsize(appPath),
            'profile':demjson.decode(profile)
        }
        m = hashlib.md5()
        m.update(file_data)
        profile['profile']['build']['md5'] = base64.urlsafe_b64encode(m.digest()).rstrip("=")
        file_data = None
        if profileChanged:
            uwsgi.cache_update(key, json.dumps(profile))
        else:
            uwsgi.cache_set(key, json.dumps(profile))

    profile["profile"]["dependents"] = {}
    #get vendor md5
    vendorPath = os.path.join(DIST_PATH,"vendor.js")
    if not os.path.exists(vendorPath):
        raise Exception("Vendor library not found")
    key = "{}_profile".format("vendor")

    profileChanged = False
    vendorProfile = None
    if uwsgi.cache_exists(key):
        vendorProfile = uwsgi.cache_get(key)
    
    if vendorProfile:
        vendorProfile = json.loads(vendorProfile)
        if repr(os.path.getmtime(vendorPath)) != vendorProfile["mtime"] or os.path.getsize(vendorPath) != vendorProfile["size"]:
            profileChanged = True
            vendorProfile = None

    if not vendorProfile:
        m = hashlib.md5()
        with open(vendorPath,"rb") as f:
            m.update(f.read())
        vendorProfile = {
            'mtime':repr(os.path.getmtime(vendorPath)),
            'size':os.path.getsize(vendorPath),
            'vendorMD5':base64.urlsafe_b64encode(m.digest()).rstrip("=")
        }
        if profileChanged:
            uwsgi.cache_update(key, json.dumps(vendorProfile))
        else:
            uwsgi.cache_set(key, json.dumps(vendorProfile))

    profile["profile"]["dependents"]["vendorMD5"] = vendorProfile["vendorMD5"]

    #get env profile
    envPath = os.path.join(BASE_DIST_PATH,'release','static','js',"{}-{}.env.js".format(app,ENV_TYPE))
    if not os.path.exists(envPath):
        raise Exception("'{}-{}.env.js' is missing.".format(app,ENV_TYPE))
    else:
        key = "{}_{}_profile".format("env",ENV_TYPE)
        profileChanged = False

        envProfile = None
        if uwsgi.cache_exists(key):
            envProfile = uwsgi.cache_get(key)
    
        if envProfile:
            envProfile = json.loads(envProfile)
            if repr(os.path.getmtime(envPath)) != envProfile["mtime"] or os.path.getsize(envPath) != envProfile["size"]:
                profileChanged = True
                envProfile = None

        if not envProfile:
            m = hashlib.md5()
            with open(envPath,"rb") as f:
                m.update(f.read())
            envProfile = {
                'mtime':repr(os.path.getmtime(envPath)),
                'size':os.path.getsize(envPath),
                'envMD5':base64.urlsafe_b64encode(m.digest()).rstrip("=")
            }
            if profileChanged:
                uwsgi.cache_update(key, json.dumps(envProfile))
            else:
                uwsgi.cache_set(key, json.dumps(envProfile))

        profile["profile"]["dependents"]["envMD5"] = envProfile["envMD5"]
        profile["profile"]["envType"] = ENV_TYPE

    #get style profile
    stylePath = os.path.join(BASE_DIST_PATH,'release','static','css',"style.css")
    if not os.path.exists(stylePath):
        raise Exception("'style.css' is missing.")
    else:
        key = "style_profile"
        profileChanged = False

        styleProfile = None
        if uwsgi.cache_exists(key):
            styleProfile = uwsgi.cache_get(key)
    
        if styleProfile:
            styleProfile = json.loads(styleProfile)
            if repr(os.path.getmtime(stylePath)) != styleProfile["mtime"] or os.path.getsize(stylePath) != styleProfile["size"]:
                profileChanged = True
                styleProfile = None

        if not styleProfile:
            m = hashlib.md5()
            with open(stylePath,"rb") as f:
                m.update(f.read())
            styleProfile = {
                'mtime':repr(os.path.getmtime(stylePath)),
                'size':os.path.getsize(stylePath),
                'styleMD5':base64.urlsafe_b64encode(m.digest()).rstrip("=")
            }
            if profileChanged:
                uwsgi.cache_update(key, json.dumps(styleProfile))
            else:
                uwsgi.cache_set(key, json.dumps(styleProfile))

        profile["profile"]["dependents"]["styleMD5"] = styleProfile["styleMD5"]


    return profile["profile"]

@bottle.route("/profile/<app>")
def profile(app):
    #get app profile
    try:
        profile = _get_profile(app)
        bottle.response.set_header("Content-Type", "application/json")
        return profile
    except:
        bottle.response.status = 400
        bottle.response.set_header("Content-Type","text/plain")
        traceback.print_exc()
        return traceback.format_exception_only(sys.exc_type,sys.exc_value)

@bottle.route("/example/<name>")
def example(name):
    if os.path.exists(os.path.join(BASE_PATH,"{}.html".format(name))):
        return bottle.template("{}.html".format(name))
    else:
        return bottle.template("embeddedmap.html",app=name)

@bottle.route('/<app>')
def index(app):
    try:
        profile = _get_profile(app)
        if profile["dependents"]["vendorMD5"] != profile["build"]["vendorMD5"]:
            raise Exception("Application was built base on outdated vendor library, please build application again.")
        return bottle.template('index.html', app=app,envType=ENV_TYPE,profile=profile)
    except:
        bottle.response.status = 400
        bottle.response.set_header("Content-Type","text/plain")
        traceback.print_exc()
        return traceback.format_exception_only(sys.exc_type,sys.exc_value)

application = bottle.default_app()
