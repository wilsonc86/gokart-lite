import os
import dotenv
import bottle
import pytz
import datetime


dotenv.load_dotenv(dotenv.find_dotenv())

bottle.TEMPLATE_PATH.append('./gokart')
bottle.debug(True)
bottle.BaseRequest.MEMFILE_MAX = 20 * 1024 * 1024

BASE_PATH = os.path.dirname(__file__)
BASE_DIST_PATH = os.path.join(os.path.dirname(BASE_PATH),"dist")
ENV_TYPE = (os.environ.get("ENV_TYPE") or "prod").lower()

PERTH_TIMEZONE = datetime.datetime.now(pytz.timezone('Australia/Perth')).tzinfo


