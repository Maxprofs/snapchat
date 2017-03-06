module.exports = StringUtils

var crypto = require('crypto')
var uuid = require('uuid')
var constants = require('./constants')
var bignum = require('bignum')
var ursa = require('ursa')
var NodeRSA = require('node-rsa')
var BufferUtils = require('./buffer-utils')

/**
 * @namespace
 * @static
 */
function StringUtils () {
  // static class
}

/**
 * @return {string} milliseconds for current time from epoch as a string
 */
StringUtils.timestamp = function () {
  return StringUtils.timestampFrom(new Date())
}

/**
 * @param {Date} date
 * @return {string} milliseconds date is from epoch as a string
 */
StringUtils.timestampFrom = function (date) {
  return '' + date.getTime()
}

/**
 * @param {string} str
 * @param {string} key
 * @return {string}
 */
StringUtils.hashHMacToBase64 = function (str, key) {
  return crypto.createHmac('sha256', key).update(str).digest('base64')
}

/**
 * @param {string} str
 * @return {string}
 */
StringUtils.md5HashToHex = function (str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

/**
 * @param {string} str
 * @return {string}
 */
StringUtils.sha256HashToBase64 = function (str) {
  return crypto.createHash('sha256').update(str).digest('base64')
}

/**
 * @param {string} str
 * @return {string}
 */
StringUtils.sha256HashToHex = function (str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

/**
 * @param {string} first
 * @param {string} second
 * @return {string}
 */
StringUtils.hashSCString = function (first, second) {
  return BufferUtils.hashSC(new Buffer(first), new Buffer(second))
}

/**
 * Returns the pre-hash string used for Snapchat requests.
 *
 * @param {string} username
 * @param {string} password
 * @param {string} timestamp
 * @param {string} endpoint
 * @return {string}
 */
StringUtils.getSCPreHashString = function (username, password, timestamp, endpoint) {
  return username + '|' + password + '|' + timestamp + '|' + endpoint
}

/**
 * Attempts to parse the given string as JSON, returning null upon parse error.
 *
 * @param {string} input
 * @return {Object}
 */
StringUtils.tryParseJSON = function (input) {
  try {
    return JSON.parse(input)
  } catch (e) {
    return null
  }
}

StringUtils.matchGroup = function (input, regex, index) {
  if (input && typeof input === 'string') {
    var matches = input.match(regex)

    if (matches && index < matches.length) {
      return matches[index]
    }
  }

  return null
}

/**
 * @param {string} first
 * @param {string} second
 * @return {string}
 */
StringUtils.SCIdentifier = function (first, second) {
  return first + '~' + second
}

/**
 * @param {string} sender
 * @return {string}
 */
StringUtils.mediaIdentifier = function (sender) {
  var hash = StringUtils.md5HashToHex(uuid.v4())
  return sender.toUpperCase() + '~' + hash
}

/**
 * @return {string}
 */
StringUtils.uniqueIdentifer = function () {
  var hash = StringUtils.md5HashToHex(uuid.v4())
  return hash.substr(0, 8) + '-' +
    hash.substr(8, 4) + '-' +
    hash.substr(12, 4) + '-' +
    hash.substr(16, 4) + '-' +
    hash.substr(20, 12)
}

/**
 * Encrypts the given password for use with Google's Android authentication.
 *
 * @param {string} gmailEmail
 * @param {string} gmailPassword
 * @return {string}
 */
StringUtils.encryptGmailPassword = function (gmailEmail, gmailPassword) {
  var keyBuffer = new Buffer(constants.core.googleDefaultPublicKey, 'base64')

  var halfString1 = keyBuffer.toString('hex').substr(8, 256)
  var modulus = bignum(halfString1, 16)

  var halfString2 = keyBuffer.toString('hex').substr(272, 6)
  var exponent = bignum(halfString2, 16)

  var shasum = crypto.createHash('sha1')
  shasum.update(keyBuffer.toString('binary'))

  var signature = '00' + shasum.digest('hex').substr(0, 8)

  var pem = ursa
    .createPublicKeyFromComponents(modulus.toBuffer(), exponent.toBuffer())
    .toPublicPem()
    .toString()

  var plain = gmailEmail + '\x00' + gmailPassword

  var key = new NodeRSA(pem)
  var encrypted = key.encrypt(plain, 'hex')

  var output = new Buffer(signature + encrypted.toString('hex'), 'hex')
  var base64Output = output.toString('base64')

  base64Output = base64Output.replace(/\+/g, '-')
  base64Output = base64Output.replace(/\//g, '_')

  return base64Output
}

/**
 * Validate an URL
 *
 * @param  {string}  url
 * @return {boolean}
 */
StringUtils.isAbsoluteURL = function (url) {
  return (/^http?s:\/\//).test(url)
}
