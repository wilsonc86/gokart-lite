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

from .settings import *

# serve up map apps
@bottle.route('/<app>')
def index(app):
    return bottle.template('index.html', app=app,envType=ENV_TYPE)

profile_re = re.compile("gokartProfile\s*=\s*(?P<profile>\{.+\})\s*;?\s*exports.+default.+gokartProfile",re.DOTALL)
envVersion_re = re.compile("envVersion\s*:\s*[\"\'](?P<version>[a-zA-Z0-9\.\:\-\ ]+)[\"\']")
styleVersion_re = re.compile("\/\*\s*version\s*:\s*[\"\']?\s*(?P<version>[a-zA-Z0-9\.\:\-][a-zA-Z0-9\.\:\-\ ]+[a-zA-Z0-9\.\:\-])\s*[\"\']?\s*\*\/")
@bottle.route("/profile/<app>/<dist>")
def profile(app,dist):
    #get app profile
    try:
        profile = None
        appPath = os.path.join(BASE_DIST_PATH,dist,"{}.js".format(app))
        if not os.path.exists(appPath):
            appPath = os.path.join(BASE_DIST_PATH,dist,"sss.js")
    
        key = "{}_{}_profile".format(app,dist)
        profileChanged = False
        
        if uwsgi.cache_exists(key):
            profile = uwsgi.cache_get(key)
        
        if profile:
            profile = json.loads(profile)
            if repr(os.path.getmtime(appPath)) != profile["mtime"] or os.path.getsize(appPath) != profile["size"]:
                profileChanged = True
                profile = None
    
        if not profile:
            with open(appPath,"rb") as f:
                m = profile_re.search(f.read())
                profile = m.group("profile") if m else "{}"
            profile = {
                'mtime':repr(os.path.getmtime(appPath)),
                'size':os.path.getsize(appPath),
                'profile':demjson.decode(profile)
            }
            if profileChanged:
                uwsgi.cache_update(key, json.dumps(profile))
            else:
                uwsgi.cache_set(key, json.dumps(profile))
    
        #get vendor md5
        vendorPath = os.path.join(BASE_DIST_PATH,dist,"vendor.js")
        if not os.path.exists(vendorPath):
            raise Exception("Vendor library({}) not found".format(dist))
        key = "{}_{}_profile".format("vendor",dist)
    
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
                'vendorMD5':base64.b64encode(m.digest())
            }
            if profileChanged:
                uwsgi.cache_update(key, json.dumps(vendorProfile))
            else:
                uwsgi.cache_set(key, json.dumps(vendorProfile))
    
        profile["profile"]["build"]["vendorMD5"] = vendorProfile["vendorMD5"]
    
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
                with open(envPath,"rb") as f:
                    m = envVersion_re.search(f.read())
                    envVersion = m.group("version") if m else None
                    envProfile = {
                        'mtime':repr(os.path.getmtime(envPath)),
                        'size':os.path.getsize(envPath),
                        'envVersion':envVersion,
                    }
                if profileChanged:
                    uwsgi.cache_update(key, json.dumps(envProfile))
                else:
                    uwsgi.cache_set(key, json.dumps(envProfile))
    
            profile["profile"]["envVersion"] = envProfile["envVersion"]
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
                with open(stylePath,"rb") as f:
                    m = styleVersion_re.search(f.read())
                    styleVersion = m.group("version") if m else None
                    styleProfile = {
                        'mtime':repr(os.path.getmtime(stylePath)),
                        'size':os.path.getsize(stylePath),
                        'styleVersion':styleVersion,
                    }
                if profileChanged:
                    uwsgi.cache_update(key, json.dumps(styleProfile))
                else:
                    uwsgi.cache_set(key, json.dumps(styleProfile))
    
            profile["profile"]["styleVersion"] = styleProfile["styleVersion"]
    
        bottle.response.set_header("Content-Type", "application/json")
        return profile["profile"]
    except:
        bottle.response.status = 400
        bottle.response.set_header("Content-Type","text/plain")
        traceback.print_exc()
        return traceback.format_exception_only(sys.exc_type,sys.exc_value)

application = bottle.default_app()
