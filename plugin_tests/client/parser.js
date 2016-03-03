$(function () {
    window.histomicstk = {};
    girderTest.addCoveredScripts([
        '/plugins/HistomicsTK/web_client/js/schema/parser.js'
    ]);
});

beforeEach(function () {
    waitsFor(function () {
        return !!(histomicstk || {}).schema;
    });
});

describe('XML Schema parser', function () {
    describe('constraints', function () {
        it('empty', function () {
            expect(histomicstk.schema._parseConstraints())
                .toEqual({});
        });
        it('missing step', function () {
            var xml = $.parseXML(
                '<constraints><minimum>1</minimum><maximum>3</maximum></constraints>'
            );
            expect(histomicstk.schema._parseConstraints(
                xml
            )).toEqual({min: '1', max: '3'});
        });
        it('full spec', function () {
            var xml = $.parseXML(
                '<constraints><minimum>0</minimum><maximum>2</maximum><step>0.5</step></constraints>'
            );
            expect(histomicstk.schema._parseConstraints(
                xml
            )).toEqual({min: '0', max: '2', step: '0.5'});
        });
    });
    describe('scalar parameter', function () {
        it('basic spec', function () {
            var xml = $.parseXML(
                '<integer>' +
                '<longflag>foo</longflag>' +
                '<label>arg1</label>' +
                '<description>An integer</description>' +
                '</integer>'
            );
            expect(histomicstk.schema._parseScalarParam(
                'integer', xml
            )).toEqual({
                type: 'number',
                slicerType: 'integer',
                id: 'foo',
                title: 'arg1',
                description: 'An integer'
            });
        });
    });
    describe('default value', function () {
        it('no value provided', function () {
            expect(histomicstk.schema._parseDefault('integer', $())).toEqual({});
        });
        it('a integer provided', function () {
            expect(histomicstk.schema._parseDefault(
                'integer',
                $('<default>1</default>')
            )).toEqual({value: '1'});
        });
    });
    describe('parameter groups', function () {
        /**
         * Return a parser with the param component mocked to
         * limit testing here to just the parameter groups.
         */
        function mockParser() {
            function parseParam(x) {
                return x.tagName;
            }
            return _.extend({}, histomicstk.schema, {
                _parseParam: parseParam
            });
        }

        it('a single group', function () {
            var xml = $.parseXML(
                '<parameters>' +
                '<label>group1</label>' +
                '<description>This is group1</description>' +
                '<param1></param1>' +
                '<param2></param2>' +
                '<param3></param3>' +
                '</parameters>'
            );
            expect(
                mockParser()._parseGroup($(xml).find('label').get(0))
            ).toEqual({
                label: 'group1',
                description: 'This is group1',
                parameters: ['param1', 'param2', 'param3']
            });
        });

        it('multiple groups', function () {
            var xml = $.parseXML(
                '<parameters>' +
                '<label>group1</label>' +
                '<description>This is group1</description>' +
                '<param1></param1>' +
                '<label>group2</label>' +
                '<description>This is group2</description>' +
                '<param2></param2>' +
                '</parameters>'
            );
            expect(
                mockParser()._parseGroup($(xml).find('label').get(0))
            ).toEqual({
                label: 'group1',
                description: 'This is group1',
                parameters: ['param1']
            });
            expect(
                mockParser()._parseGroup($(xml).find('label').get(1))
            ).toEqual({
                label: 'group2',
                description: 'This is group2',
                parameters: ['param2']
            });
        });
    });

    describe('Panels', function () {
        /**
         * Return a parser with the group component mocked to
         * limit testing here to just the panels.
         */
        function mockParser() {
            function parseGroup(x) {
                return $(x).text();
            }
            return _.extend({}, histomicstk.schema, {
                _parseGroup: parseGroup
            });
        }

        it('default panel with one param group', function () {
            var xml = $.parseXML(
                '<parameters>' +
                '<label>group1</label>' +
                '<description>This is group1</description>' +
                '<param1></param1>' +
                '</parameters>'
            );
            expect(
                mockParser()._parsePanel($(xml).find('parameters').get(0))
            ).toEqual({
                advanced: false,
                groups: ['group1']
            });
        });

        it('advanced panel with one param group', function () {
            var xml = $.parseXML(
                '<parameters advanced="true">' +
                '<label>group1</label>' +
                '<description>This is group1</description>' +
                '<param1></param1>' +
                '</parameters>'
            );
            expect(
                mockParser()._parsePanel($(xml).find('parameters').get(0))
            ).toEqual({
                advanced: true,
                groups: ['group1']
            });
        });

        it('a panel with multiple param groups', function () {
            var xml = $.parseXML(
                '<parameters advanced="false">' +
                '<label>group1</label>' +
                '<description>This is group1</description>' +
                '<param1></param1>' +
                '<label>group2</label>' +
                '<description>This is group2</description>' +
                '<param2></param2>' +
                '<label>group3</label>' +
                '<description>This is group3</description>' +
                '<param3></param3>' +
                '</parameters>'
            );
            expect(
                mockParser()._parsePanel($(xml).find('parameters').get(0))
            ).toEqual({
                advanced: false,
                groups: ['group1', 'group2', 'group3']
            });
        });
    });

    describe('Executable', function () {
        /**
         * Return a parser with the panel component mocked to
         * limit testing here to just the top-level executable.
         */
        function mockParser() {
            function parsePanel(x) {
                return $(x).text();
            }
            return _.extend({}, histomicstk.schema, {
                _parsePanel: parsePanel
            });
        }

        it('a minimal executable', function () {
            var xml = $.parseXML(
                '<executable>' +
                '<title>The title</title>' +
                '<description>A description</description>' +
                '</executable>'
            );
            expect(
                mockParser().parse(xml)
            ).toEqual({
                title: 'The title',
                description: 'A description',
                panels: []
            });
        });

        it('optional metadata', function () {
            var xml = $.parseXML(
                '<executable>' +
                '<title>The title</title>' +
                '<description>A description</description>' +
                '<version>0.0.0</version>' +
                '<documentation-url>//a.url.com</documentation-url>' +
                '<license>WTFPL</license>' +
                '<contributor>John Doe</contributor>' +
                '<acknowledgements>Jane Doe</acknowledgements>' +
                '</executable>'
            );
            expect(
                mockParser().parse(xml)
            ).toEqual({
                title: 'The title',
                description: 'A description',
                version: '0.0.0',
                'documentation-url': '//a.url.com',
                license: 'WTFPL',
                contributor: 'John Doe',
                acknowledgements: 'Jane Doe',
                panels: []
            });
        });

        it('a single parameter panel', function () {
            var xml = $.parseXML(
                '<executable>' +
                '<title>The title</title>' +
                '<description>A description</description>' +
                '<parameters>params1</parameters>' +
                '</executable>'
            );
            expect(
                mockParser().parse(xml)
            ).toEqual({
                title: 'The title',
                description: 'A description',
                panels: ['params1']
            });
        });

        it('multiple panels', function () {
            var xml = $.parseXML(
                '<executable>' +
                '<title>The title</title>' +
                '<description>A description</description>' +
                '<parameters>params1</parameters>' +
                '<parameters>params2</parameters>' +
                '<parameters>params3</parameters>' +
                '</executable>'
            );
            expect(
                mockParser().parse(xml)
            ).toEqual({
                title: 'The title',
                description: 'A description',
                panels: ['params1', 'params2', 'params3']
            });
        });
    });

    // integration test with no mocking
    it('a full example spec', function () {
        var spec = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<executable>',
            '<category>Tours</category>',
            '<title>Execution Model Tour</title>',
            '<description>',
            'Shows one of each type of parameter.',
            '</description>',
            '<version>1.0</version>',
            '<documentation-url></documentation-url>',
            '<license></license>',
            '<contributor>Daniel Blezek</contributor>',
            '<parameters>',
            '<label>Scalar Parameters</label>',
            '<description>',
            'Variations on scalar parameters',
            '</description>',
            '<integer>',
            '<name>integerVariable</name>',
            '<flag>i</flag>',
            '<longflag>integer</longflag>',
            '<description>',
            'An integer without constraints',
            '</description>',
            '<label>Integer Parameter</label>',
            '<default>30</default>',
            '</integer>',
            '<label>Scalar Parameters With Constraints</label>',
            '<description>Variations on scalar parameters</description>',
            '<double>',
            '<name>doubleVariable</name>',
            '<flag>d</flag>',
            '<longflag>double</longflag>',
            '<description>An double with constraints</description>',
            '<label>Double Parameter</label>',
            '<default>30</default>',
            '<constraints>',
            '<minimum>0</minimum>',
            '<maximum>1.e3</maximum>',
            '<step>0</step>',
            '</constraints>',
            '</double>',
            '</parameters>',
            '<parameters>',
            '<label>Vector Parameters</label>',
            '<description>Variations on vector parameters</description>',
            '<float-vector>',
            '<name>floatVector</name>',
            '<flag>f</flag>',
            '<description>A vector of floats</description>',
            '<label>Float Vector Parameter</label>',
            '<default>1.3,2,-14</default>',
            '</float-vector>',
            '<string-vector>',
            '<name>stringVector</name>',
            '<longflag>string_vector</longflag>',
            '<description>A vector of strings</description>',
            '<label>String Vector Parameter</label>',
            '<default>"foo",bar,"foobar"</default>',
            '</string-vector>',
            '</parameters>',
            '<parameters>',
            '<label>Enumeration Parameters</label>',
            '<description>Variations on enumeration parameters</description>',
            '<string-enumeration>',
            '<name>stringChoice</name>',
            '<flag>e</flag>',
            '<longflag>enumeration</longflag>',
            '<description>An enumeration of strings</description>',
            '<label>String Enumeration Parameter</label>',
            '<default>foo</default>',
            '<element>foo</element>',
            '<element>"foobar"</element>',
            '<element>foofoo</element>',
            '</string-enumeration>',
            '</parameters>',
            '</executable>'
        ].join('');

        expect(
            histomicstk.schema.parse(spec)
        ).toEqual(
            {
              'title': 'Execution Model Tour',
              'description': 'Shows one of each type of parameter.',
              'version': '1.0',
              'documentation-url': '',
              'license': '',
              'contributor': 'Daniel Blezek',
              'panels': [
                {
                  'advanced': false,
                  'groups': [
                    {
                      'label': 'Scalar Parameters',
                      'description': 'Variations on scalar parameters',
                      'parameters': [
                        {
                          'type': 'number',
                          'slicerType': 'integer',
                          'id': 'integerVariable',
                          'title': 'Integer Parameter',
                          'description': 'An integer without constraints',
                          'value': '30'
                        }
                      ]
                    },
                    {
                      'label': 'Scalar Parameters With Constraints',
                      'description': 'Variations on scalar parameters',
                      'parameters': [
                        {
                          'type': 'number',
                          'slicerType': 'double',
                          'id': 'doubleVariable',
                          'title': 'Double Parameter',
                          'description': 'An double with constraints',
                          'value': '30',
                          'min': '0',
                          'max': '1.e3',
                          'step': '0'
                        }
                      ]
                    }
                  ]
                },
                {
                  'advanced': false,
                  'groups': [
                    {
                      'label': 'Vector Parameters',
                      'description': 'Variations on vector parameters',
                      'parameters': [
                        {},
                        {}
                      ]
                    }
                  ]
                },
                {
                  'advanced': false,
                  'groups': [
                    {
                      'label': 'Enumeration Parameters',
                      'description': 'Variations on enumeration parameters',
                      'parameters': [
                        {}
                      ]
                    }
                  ]
                }
              ]
            }
        );
    });
});
