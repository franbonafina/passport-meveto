// Load modules.
const Str = require('@supercharge/strings')
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , APIError = require('./errors/apierror');


/**
 * `Strategy` constructor.
 *
 * The Meveto authentication strategy authenticates requests by delegating to
 * Meveto using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `clientID`      your GitHub application's Client ID
 *   - `clientSecret`  your GitHub application's Client Secret
 *   - `callbackURL`   URL to which GitHub will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.  valid scopes include:
 *                     'user', 'public_repo', 'repo', 'gist', or none.
 *                     (see http://developer.github.com/v3/oauth/#scopes for more info)
 *   — `userAgent`     All API requests MUST include a valid User Agent string.
 *                     e.g: domain name of your application.
 *                     (see http://developer.github.com/v3/#user-agent-required for more info)
 *
 * Examples:
 *
 *     passport.use(new MevetoStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/github/callback',
 *         userAgent: 'myapp.com'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://dashboard.meveto.com/oauth-client';
  options.tokenURL = options.tokenURL || 'https://prod.meveto.com/oauth/token';
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};
  options.state = Str.random();

  OAuth2Strategy.call(this, options, verify);

  this.name = 'meveto';
  this._userProfileURL = 'https://prod.meveto.com/api/client/user?client_id=' + options.clientID;
  this._oauth2.useAuthorizationHeaderforGET(true);
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Meveto.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `meveto`
 *   - `id`               the user's MEveto ID
 *   - `username`         the user's GitHub username
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  let self = this;
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    let json;

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    const profile = Profile.parse(json);

    profile.provider  = { id: "meveto"}
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
}

/*
   This provide the params received by the redirect or return endpoint, in outh2 protocol.
 */
Strategy.prototype.authorizationParams = function(options) {
  return {
    'client_token' : options.client_token,
    'sharing_token': options.state
  };
};

// Expose constructor.
module.exports = Strategy;
