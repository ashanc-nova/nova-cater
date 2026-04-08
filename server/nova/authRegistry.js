import { deepClone } from '../catering/utils.js'

export class AuthRegistry {
  constructor() {
    this.userProfilesByToken = new Map()
  }

  registerUserToken(userToken, profile) {
    if (!userToken || !profile) return
    this.userProfilesByToken.set(userToken, deepClone(profile))
  }

  getUserProfile(userToken) {
    const profile = this.userProfilesByToken.get(userToken)
    return profile ? deepClone(profile) : null
  }
}
