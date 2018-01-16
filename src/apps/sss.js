import {utils} from 'src/vendor.js'
import profile from './sss-profile.js'
import gokart from '../gokart.js'


gokart.checkVersion = function(check) {
    utils.checkVersion(gokartEnv.app,profile,check)
}
global.gokart = gokart

gokart.checkVersion(false)




