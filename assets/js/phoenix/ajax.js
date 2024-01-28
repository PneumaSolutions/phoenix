import { phxGlobal } from "./constants"

export default class Ajax {

  static request(method, endPoint, accept, body, timeout, ontimeout, callback){
    const controller = new AbortController()
    const signal = controller.signal
    let aborted = false
    let timer = setTimeout(() => {
      timer = null
      aborted = true
      controller.abort()
      if (ontimeout) {
        ontimeout()
      }
    }, timeout)
    let promise = phxGlobal.fetch(endPoint, {
      method,
      headers: {
        "Content-Type": accept,
      },
      body,
      signal,
    })
    promise.then(response => {
      if (aborted) {
        return
      }
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (!response.ok) {
        if (callback) {
          callback(null)
        }
        return
      }
      return response.text().then(text => {
        const result = this.parseJSON(text)
        callback(result)
      })
    })
    promise.catch(_error => {
      if (aborted) {
        return
      }
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (callback) {
        callback(null)
      }
    })
    return {
      abort: () => {
        if (aborted) {
          return
        }
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        aborted = true
        controller.abort()
      }
    }
  }

  static parseJSON(resp){
    if(!resp || resp === ""){ return null }

    try {
      return JSON.parse(resp)
    } catch (e){
      console && console.log("failed to parse JSON response", resp)
      return null
    }
  }

  static serialize(obj, parentKey){
    let queryStr = []
    for(var key in obj){
      if(!Object.prototype.hasOwnProperty.call(obj, key)){ continue }
      let paramKey = parentKey ? `${parentKey}[${key}]` : key
      let paramVal = obj[key]
      if(typeof paramVal === "object"){
        queryStr.push(this.serialize(paramVal, paramKey))
      } else {
        queryStr.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal))
      }
    }
    return queryStr.join("&")
  }

  static appendParams(url, params){
    if(Object.keys(params).length === 0){ return url }

    let prefix = url.match(/\?/) ? "&" : "?"
    return `${url}${prefix}${this.serialize(params)}`
  }
}
