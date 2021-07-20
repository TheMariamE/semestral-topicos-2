var express = require('express');
var path = require('path');
require('dotenv').config({ silent: true });
var app = express();
const IamAuthenticator = require('ibm-watson/auth').IamAuthenticator;
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');

// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper
const translator = new LanguageTranslatorV3({
  version: '2019-10-10',
  authenticator: new IamAuthenticator({
    apikey: process.env.LANGUAGE_TRANSLATOR_IAM_APIKEY,
  }),
  url: process.env.LANGUAGE_TRANSLATOR_URL,
  headers: {
    'X-Watson-Technology-Preview': '2018-05-01',
    'X-Watson-Learning-Opt-Out': true,
  },
});

const ibmClient = new TextToSpeechV1({
    authenticator: new IamAuthenticator({ apikey: process.env.TEXT_TO_SPEECH_API_KEY }),
    version: '2020-04-01'
});

app.use(express.static(path.join(__dirname, 'public')));

// viewed at http://localhost:3000
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});


app.get('/api/voces', async (_, res, next) => {
    try {
      if (ibmClient) {
        const { result } = await ibmClient.listVoices();
        return res.json(result);
      } else {
        // Return Allison for testing and user still gets creds pop-up.
        return res.json(
          { voices: [
            { name: 'es-ES_EnriqueV3Voice',
              description: 'Enrique: American English female voice. Dnn technology.',
            }]
          });
      }
    } catch (err) {
      console.error(err);
      if (!client) {
        err.statusCode = 401;
        err.description = 'no se pueden encontrar credenciales validas para el servicio de IBM.';
        err.title = 'Credenciales Invalidad';
      }
      next(err);
    }
  });

app.get('/api/sintetizar', async (req, res, next) => {
    try {
      const { result } = await ibmClient.synthesize(req.query);
      result.pipe(res);
    } catch (err) {
      console.error(err);
      if (!ibmClient) {
        err.statusCode = 401;
        err.description = 'no se pueden encontrar credenciales validas para el servicio de IBM.';
        err.title = 'Credenciales Invalidad';
      }
      next(err);
    }
});
app.get('/api/models', function(req, res, next) {
  //console.log('/v3/models');
  translator
    .listModels()
    .then(({ result }) => res.json(result))
    .catch(error => next(error));
});

app.post('/api/identify', function(req, res, next) {
  //console.log('/v3/identify');
  translator
    .identify(req.body)
    .then(({ result }) => res.json(result))
    .catch(error => next(error));
});

app.get('/api/identifiable_languages', function(req, res, next) {
  //console.log('/v3/identifiable_languages');
  translator
    .listIdentifiableLanguages(req.body)
    .then(({ result }) => res.json(result))
    .catch(error => next(error));
});

app.post('/api/translate', function(req, res, next) {
  //console.log('/v3/translate');
  translator
    .translate(req.body)
    .then(({ result }) => res.json(result))
    .catch(error => next(error));
});


require('./error-handler')(app);

module.exports = app;