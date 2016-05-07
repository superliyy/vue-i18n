import { warn, isPromise } from './util'

let locales = Object.create(null) // locales store


export default function (Vue) {
  /**
   * Register or retrieve a global locale definition.
   *
   * @param {String} id
   * @param {Object | Function | Promise} definition
   * @param {Function} cb
   */
  
  Vue.locale = (id, definition, cb) => {
    if (definition === undefined) { // gettter
      return locales[id]
    } else { // setter
      if (definition === null) {
        locales[id] = undefined
        delete locales[id]
      } else {
        setLocale(id, definition, (locale) => {
          if (locale) {
            locales[id] = locale
            cb && cb()
          } else {
            warn('failed set `' + id + '` locale')
          }
        })
      }
    }
  }
}


function setLocale (id, definition, cb) {
  if (typeof definition === 'object') { // sync
    cb(definition)
  } else {
    let future = definition.call(this)
    if (typeof future === 'function') {
      if (future.resolved) {
        // cached
        cb(future.resolved)
      } else if (future.requested) {
        // pool callbacks
        future.pendingCallbacks.push(cb)
      } else {
        future.requested = true
        let cbs = future.pendingCallbacks = [cb]
        future((locale) => { // resolve
          future.resolved = locale
          for (let i = 0, l = cbs.length; i < l; i++) {
            cbs[i](locale)
          }
        }, () => { // reject
          cb()
        })
      }
    } else if (isPromise(future)) { // promise
      future.then((locale) => { // resolve
        cb(locale)
      }, () => { // reject
        cb()
      }).catch((err) => {
        console.error(err)
        cb()
      })
    }
  }
}