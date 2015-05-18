var assert = require('chai').assert;
var fury = require('../../lib/fury');
var legacyParser = require('../../lib/fury').legacyBlueprintParser;
var legacyRenderer = require('../../lib/fury').legacyMarkdownRenderer;

describe('Refract loader', function () {
  describe('autodetect', function () {
    it('should support shorthand', function () {
      let api = fury.load(['category', {'class': 'api'}, {}, []]);
      assert(api);
    });

    it('should support long-form', function () {
      let api = fury.load({
        element: 'category',
        meta: {
          'class': 'api'
        },
        content: []
      });
      assert(api);
    });
  });

  describe('shorthand', function () {
    var api;

    before(function () {
      api = fury.load([
        'category', {'class': ['api'], 'title': 'My API'}, {}, [
          ['category', {'class': ['resourceGroup'], title: 'My Group'}, {}, [
            ['copy', {}, {contentType: 'text/plain'}, 'Extra text'],
            ['resource', {title: 'Frob'}, {
              href: '/frobs/{id}',
              hrefVariables: ['hrefVariables', {}, {}, [
                  ['string', {name: 'id'}, {}, '']
                ]]
              }, [
              ['dataStructure', {}, {}, [
                ['string', {name: 'id'}, {}, null],
                ['string', {name: 'tag'}, {}, null]
              ]],
              ['transition', {}, {}, [
                ['httpTransaction', {}, {}, [
                  ['httpRequest', {}, {}, null],
                  ['httpResponse', {}, {statusCode: 200, headers: ['httpHeaders', {}, {}, [
                    ['string', {name: 'Content-Type'}, {}, 'application/json']
                  ]]}, [
                    ['asset', {'class': 'messageBody'}, {}, '{"id": "1", "tag": "foo"}']
                  ]]
                ]]
              ]]
            ]]
          ]]
        ]
      ]);
    });

    it('should parse a refract shorthand API', function () {
      assert.ok(api);
    });

    it('should contain a title', function () {
      assert.equal(api.title, 'My API');
    });

    it('should contain a single resource group', function () {
      assert.equal(api.resourceGroups.length, 1);
      assert.equal(api.resourceGroups.get(0).title, 'My Group');
    });

    it('should contain a single copy element', function () {
      assert.equal(api.resourceGroups.get(0).copy.length, 1);
      assert.equal(api.resourceGroups.get(0).copy.get(0).content, 'Extra text');
    });

    it('should contain a single resource', function () {
      assert.equal(api.resourceGroups.get(0).resources.length, 1);
    });

    it('should have an `id` href variable', function () {
      var resource = api.resourceGroups.get(0).resources.get(0);
      assert.equal(resource.hrefVariables.length, 1);
      assert.equal(resource.hrefVariables.keys()[0], 'id');
    });

    it('should contain a single transition', function () {
      assert.equal(api.resourceGroups.get(0).resources.get(0).transitions.length, 1);
    });

    it('should contain a single transaction', function () {
      assert.equal(api.resourceGroups.get(0).resources.get(0).transitions.get(0)
                   .transactions.length, 1);
    });

    it('Should contain a request', function () {
      var resource = api.resourceGroups.get(0).resources.get(0);
      var request = resource.transitions.get(0).transactions.get(0).request;

      assert(request);
    });

    it('Should contain a response', function () {
      var resource = api.resourceGroups.get(0).resources.get(0);
      var response = resource.transitions.get(0).transactions.get(0).response;

      assert(response);
      assert.equal(response.statusCode, 200);
    });

    it('should set content-type header in the response', function () {
      var resource = api.resourceGroups.get(0).resources.get(0);
      var response = resource.transitions.get(0).transactions.get(0).response;

      // Get the header element by index and read the value
      assert.equal(response.headers.get(0).content, 'application/json');

      // Convenience to get a header by name
      assert.equal(response.header('content-type'), 'application/json');
    });
  });
});

describe('Using legacy parser', function() {

  var parserError = null;
  var parsedAPI = null;
  var parserWarnings = null;

  describe('to parse API Blueprint', function() {
    before(function(done) {
      var blueprintSource = 'FORMAT: 1A\n' +
                            '\n' +
                            '# My API\n';

      legacyParser.parse({code: blueprintSource}, function(error, api, warnings) {
        parserError = error;
        parsedAPI = api;
        parserWarnings = warnings;
        done();
      });
    });

    it ('should succeed', function() {
      assert.isNull(parserError);
    });

    it ('API should be defined', function() {
      assert.isDefined(parsedAPI);
    });

    it ('API name should be "My API"', function() {
      assert.equal(parsedAPI.name, 'My API');
    });
  });

  describe('to parse Apiary Blueprint', function() {

    before(function(done) {
      var blueprintSource = '\n--- Sample API v2 ---\n';

      legacyParser.parse({code: blueprintSource}, function(error, api, warnings) {
        parserError = error;
        parsedAPI = api;
        parserWarnings = warnings;
        done();
      });
    });

    it ('should succeed', function() {
      assert.isNull(parserError);
    });

    it ('API should be defined', function() {
      assert.isDefined(parsedAPI);
    });

    it ('API name should be "Sample API v2"', function() {
      assert.equal(parsedAPI.name, 'Sample API v2');
    });
  });
});

describe('Using legacy Markdown renderer', function() {
  describe('to render Markdown', function() {

    var renderError = null;
    var renderResult = null;

    before(function(done) {
      var source = '# My API\n';

      legacyRenderer.toHtml(source, {}, function(error, html) {
        renderError = error;
        renderResult = html;
        done();
      });
    });

    it ('should succeed', function() {
      assert.isNull(renderError);
    });

    it ('result should be defined', function() {
      assert.isDefined(renderResult);
    });

    it ('result should be rendered correctly', function() {
      assert.equal(renderResult, "<h1>My API</h1>\n");
    });

  });

});
