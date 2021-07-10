/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: 'plantuml', // https://plantuml.com/sitemap-language-specification

    extras: $ => [
        // /\t\v\f\r /,
        /\s/,
        $.comment,
    ],

    inline: $ => [
        $.activity_diagram_legacy,
        $.activity_diagram_beta,
    ],

    externals: $ => [
        $.NOP,
        $.note_description,
        $.rnote_description,
        $.hnote_description,
        $.reference_description,
        $.title_description,
    ],

    rules: {
        plant_uml: $ => choice(
            $._diagram,
            // $.yaml,
        ),

        comment: $ => token(prec(1, choice(
            seq("'", /.*/),
            seq(
                "/'",
                /[^']*'+([^/'][^']*'+)*/,
                '/'
            )
        ))),

        _diagram: $ => seq(
            $._start_uml,
            choice(
                // $._activity_diagram,
                // $.archimate_diagram,
                // $.math_diagram,
                // $.class_diagram,
                // $.deployment_diagram,
                // $.gantt_diagram,
                // $.network_diagram,
                // $.object_diagram,
                $.sequence_diagram,
                // $.state_diagram,
                // $.style_diagram,
                // $.timing_diagram,
                // $.usecase_diagram,
                // $.wbs_diagram,
            ),
            $._end_uml
        ),

        // _activity_diagram: $ => choice($.activity_diagram_legacy, $.activity_diagram_beta),
        // activity_diagram_legacy: $ => 'TODO activity diagram legacy', // https://plantuml.com/activity-diagram-legacy
        // activity_diagram_beta: $ => 'TODO activity diagram beta', // https://plantuml.com/activity-diagram-beta

        // archimate_diagram: $ => 'TODO archimate diagram', // https://plantuml.com/archimate-diagram

        // math_diagram: $ => 'TODO math diagram', // https://plantuml.com/ascii-math

        // class_diagram: $ => 'TODO class diagram', // https://plantuml.com/class-diagram'

        color: $ => // https://plantuml.com/color
            color(),

        // command: $ => 'TODO commands', // https://plantuml.com/commons

        // component: $ => 'TODO component', // https://plantuml.com/component-diagram

        // creole: $ => 'TODO creole markup wrappers', // https://plantuml.com/creole

        // deployment_diagram: $ => 'TODO deployment diagram', // https://plantuml.com/deployment-diagram

        // gantt_diagram: $ => 'TODO gantt diagram', // https://plantuml.com/gantt-diagram

        // json: $ => 'TODO json', // https://plantuml.com/json

        // link: $ => 'TODO links', // https://plantuml.com/link

        // mindmap: $ => 'TODO mindmap', // https://plantuml.com/mindmap-diagram

        // network_diagram: $ => 'TODO nwdiag', // https://plantuml.com/nwdiag

        // object_diagram: $ => 'TODO object diagram', // https://plantuml.com/object-diagram

        // icon: $ => 'TODO OpenIconic', // https://plantuml.com/openiconic

        // preprocessing: $ => 'TODO preoprocessing', // https://plantuml.com/preprocessing

        // salt: $ => 'TODO salt (wireframe)', // https://plantuml.com/salt

        // https://plantuml.com/sequence-diagram -------------------------------------------------------------
        sequence_diagram: $ => // https://plantuml.com/sequence-diagram
            repeat1(
                seq(
                    choice(
                        $._page_heading,
                        $._page_spliting,
                        $._option,
                        $._note,
                        $.reference,
                        $.delay,
                        $.divider,
                        $.space,
                        $.autonumber,
                        $.participant_declaration,
                        $._participant_encompass,
                        $.message,
                        $._io_message,
                        $._lifeline,
                        $.pragma,
                        $.duration,
                    ),
                    '\n',
                )),

        message: $ => seq(
            optional($.anchor),
            $.participant,
            $._communication,
            $.participant,
            optional($._lifeline_shortcut),
            optional(seq(':', optional($.description))),
        ),

        _io_message: $ => alias($.io_message, $.message),
        io_message: $ => choice(
            seq(
                $.participant,
                $.right_io_arrow,
                optional($._lifeline_shortcut),
                optional(seq(':', optional($.description))),
            ),
            seq(
                $.left_io_arrow,
                $.participant,
                optional($._lifeline_shortcut),
                optional(seq(':', optional($.description))),
            ),
        ),

        participant: $ => prec.left(seq(
            choice(
                field('ref', $.name),
                field('ref', $.quoted_name),
                seq(field('ref', $.name), 'as', field('alias', $.quoted_name)),
                seq(field('alias', $.quoted_name), 'as', field('ref', $.name)),
            ),
            optional(alias($.participant_stereotype, $.stereotype)),
        )),
        participant_stereotype: $ => seq(
            '<<',
            choice(
                seq(
                    alias($.participant_spot, $.spot),
                    optional(alias(/[^>\n][^>\n]*/, $.description)),
                ),
                // TODO: Need a better way to distinguish the spot start instead of excluding `(\s`.
                // The prec(1, ...) on the above doesn't have effect on precedence over the regexp below.
                alias(/[^>(\s][^>\n]*/, $.description),
            ),
            '>>',
        ),
        participant_spot: $ => seq('(', alias(/./, $.char), ',', $.color, ')'),

        _participant_encompass: $ => alias($.participant_box, $.box),

        participant_box: $ => seq(
            'box',
            choice(
                field('name', $.name),
                field('name', $.quoted_name),
            ),
            optional($.color),
            repeat1($.participant_declaration),
            'end', 'box',
        ),

        anchor: $ => seq('{', $.name, '}'),

        duration: $ => seq(
            $.anchor,
            $._communication,
            $.anchor,
            optional(seq(':', optional($.description))),
        ),

        name: $ => /\p{ID_Start}\p{ID_Continue}*/,
        quoted_name: $ => seq('"', /[^"\n]+/, '"'),
        _communication: $ => choice(
            $.left_arrow,
            $.bidi_arrow,
            $.right_arrow
        ),
        bidi_arrow: $ => bidi_arrow(),
        right_arrow: $ => right_arrow(),
        left_arrow: $ => left_arrow(),

        right_io_arrow: $ => seq(choice(left_arrow(), right_arrow(), bidi_arrow()), choice(i`]`, i`?`)),
        left_io_arrow: $ => seq(choice(`[`, `?`), choice(left_arrow(i), right_arrow(i), bidi_arrow(i))),

        arrow_color: $ => color(i),

        description: $ => /[^\s][^\n]*/,

        participant_declaration: $ => seq(
            choice(
                'participant',
                'actor',
                'boundary',
                'control',
                'entity',
                'database',
                'collections',
                'queue',
            ),
            optional(seq(field('title', $.participant), 'as')),
            field('reference', $.participant),
            optional(seq('order', field('order', $.order))),
            optional(field('color', $.color)),
        ),
        order: $ => /\d+/,

        autonumber: $ => prec.right(1, seq(
            'autonumber',
            choice(
                seq(
                    optional(seq(
                        field('start', /\d+/),
                        optional(field('increment', /\d+/)),
                    )),
                    optional(field('format', seq('"', /[^"]*/, '"'))),
                ),
                optional(field('command', choice(
                    'stop',
                    seq(
                        'resume',
                        optional(field('increment', /\d+/)),
                        optional(field('format', seq('"', /[^"]*/, '"'))),
                    ),
                ))),
            ),
        )),

        _page_heading: $ => choice(
            seq('title', choice(
                alias($.description, $.page_title),
                seq(
                    '\n',
                    alias(repeat(alias($.title_description, sym('line'))), $.page_title),
                    'end', 'title',
                ),
            )),
            seq('header', alias($.description, $.page_header)),
            seq('footer', alias($.description, $.page_footer)),
        ),

        _page_spliting: $ => seq(
            $.newpage,
        ),

        newpage: $ => seq(
            'newpage',
            optional(alias(/[^\n]+/, $.description)),
        ),

        _note: $ => choice($.note, $.rnote, $.hnote),
        note: $ => note('note', seq('end', 'note'), $.note_description),
        rnote: $ => note('rnote', seq('endrnote'), $.rnote_description),
        hnote: $ => note('hnote', seq('endhnote'), $.hnote_description),

        note_position: $ => choice(
            alias(choice('across', 'left', 'right'), $.layout),
            seq(
                choice(
                    alias($._note_layout, $.layout),
                    alias('over', $.layout),
                ),
                alias($.name, $.participant),
                optional(seq(
                    ',',
                    alias($.name, $.participant),
                )),
            ),
        ),
        _note_layout: $ => choice(  // TODO: why wrapping in token() doesn't work?
            seq('left', 'of'),
            seq('right', 'of'),     // TODO: why wrapping in token() doesn't work?
        ),

        reference: $ => seq(
            'ref', 'over',
            alias($.name, $.participant),
            optional(seq(
                ',',
                alias($.name, $.participant),
            )),
            choice(
                seq(':', optional($.description)),
                seq(
                    '\n',
                    alias(repeat(alias($.reference_description, $.line)), $.description),
                    seq('end', 'ref'),
                ),
            ),
        ),

        delay: $ => choice(
            '...',
            seq(`...`, alias($.delay_description, $.description), i`...`),
        ),

        delay_description: $ => i(/[^\n.]+/), // TODO: It sould allow any amount of inner dots

        divider: $ => seq(`==`, alias($.divider_description, $.description), `==`),
        divider_description: $ => i(/[^\n=]+/), // TODO: It sould allow any amount of inner =

        space: $ => choice(
            '|||',
            seq(`||`, $.pixels, i`||`),
        ),

        pixels: $ => i(/\d+/),

        _lifeline: $ => choice(
            $.activate,
            $.deactivate,
            $.create,
            $.destroy,
            $.return,
        ),

        activate: $ => seq(
            'activate',
            alias($.name, $.participant),
            optional($.color),
        ),
        deactivate: $ => seq(
            'deactivate',
            alias($.name, $.participant),
        ),
        create: $ => seq(
            'create',
            choice(
                alias($.name, $.participant),
                $.participant_declaration,
            ),
        ),
        destroy: $ => seq(
            'destroy',
            alias($.name, $.participant),
        ),
        return: $ => seq(
            'return',
            alias($.name, $.message), // TODO: external token to stop on 'in' or \n to allow multiword message
            optional(seq(
                'in',
                alias($.description, $.scope),
            )),
        ),
        _lifeline_shortcut: $ => choice(
            seq(
                $._lifeline_short_def,
                optional($.color),
            ),
            $.color,
        ),

        _lifeline_short_def: $ => choice(
            choice(
                alias('++', $.activate),
                alias('--', $.deactivate),
                alias('**', $.create),
                alias('!!', $.destroy),
            ),
            choice(
                seq(alias(`++`, $.activate), alias(i`--`, $.deactivate)),
                seq(alias(`--`, $.deactivate), alias(i`++`, $.activate)),
            ),
        ),

        pragma: $ => seq(
            '!pragma',
            field('name', 'teoz'),
            field('value', 'true'),
        ),

        // sequence_diagram ----------------------------------------------------------------------------------

        _option: $ => choice(
            $._command,
            $._directive,
        ),

        _command: $ => choice(
            $.skinparam,
        ),

        skinparam: $ => // https://plantuml.com/skinparam ----------------------------------------------------
            choice(
                seq('skinparam', $.name, choice($.value, $.color)),
                seq('skinparam', 'sequence', '{',
                    repeat1(seq($.name, choice($.value, $.color))),
                    '}'
                ),
            ),
        value: $ => /\w+/,

        _directive: $ => choice(
            $.hide,
            $.autoactivate,
        ),

        hide: $ => seq('hide', $.value),
        autoactivate: $ => seq('autoactivate', 'on'),

        // skinparam -----------------------------------------------------------------------------------------

        // sprite: $ => 'TODO sprite', // https://plantuml.com/sprite

        // state_diagram: $ => 'TODO state diagram', // https://plantuml.com/state-diagram

        // style_diagram: $ => 'TODO styles', // https://plantuml.com/style-evolution

        // timing_diagram: $ => 'TODO timing diagram', // https://plantuml.com/timing-diagram

        // usecase_diagram: $ => 'TODO use case diagram', // https://plantuml.com/use-case-diagram

        // wbs_diagram: $ => 'TODO Work Breakdown Structure diagram', // https://plantuml.com/wbs-diagram

        // yaml: $ => 'TODO yaml', // https://plantuml.com/yaml

        // ***************************************************************************************************

        _start_uml: $ => '@startuml',
        _end_uml: $ => '@enduml',
    }
});

// Shorter wrapper on token.immediate()
// May be called as i('token_string') or as i`token_string` for simple cases.
function i(s) {
    if (Array.isArray(s) && s.hasOwnProperty('raw'))
        return token.immediate(s[0]);
    else return token.immediate(s);
}

function color(w = x => x) { // w - start token wrapper is NOP or `i` <=> `token.immediate`
    return seq(
        w(`#`),
        i(/[\p{ID_Start}0-9][\p{ID_Continue}0-9]*/)
    );
}

function arrow_color(w = x => x) {
    return seq(w(`[`), alias(sym('arrow_color'), sym('color')), i`]`);
}

function arrow_connect(w = x => x) {
    return choice(w(`x`), w(`o`));
}

function arrow_style({ left = false, right = false }, w = x => x) {
    const style = [];
    if (left)
        style.push(w(`<`), w(`<<`));
    style.push(w(`\\`), w(`\\\\`), w(`/`), w(`//`));
    if (right)
        style.push(w(`>`), w(`>>`));
    return choice(...style);
}

function arrow_line(w = x => x) {
    return choice(
        choice(
            seq(w(`-`), optional(arrow_color(i))),
            seq(arrow_color(w), i`-`),
        ),
        choice(
            seq(w(`--`), optional(arrow_color(i))),
            seq(w(`-`), arrow_color(i), i`-`),
            seq(arrow_color(w), i`--`),
        ),
    );
}

function right_arrow(w = x => x) {
    return seq(
        choice(
            seq(
                arrow_connect(w),
                arrow_line(i),
            ),
            arrow_line(),
        ),
        arrow_style({ right: true }, i),
        optional(arrow_connect(i)),
    );
}

function left_arrow(w = x => x) {
    return seq(
        choice(
            seq(
                arrow_connect(w),
                arrow_style({ left: true }, i),
            ),
            arrow_style({ left: true }),
        ),
        arrow_line(i),
        optional(arrow_connect(i)),
    );
}

function bidi_arrow(w = x => x) {
    return seq(
        choice(
            seq(
                arrow_connect(w),
                arrow_style({ left: true }, i),
            ),
            arrow_style({ left: true }),
        ),
        arrow_line(i),
        arrow_style({ right: true }, i),
        optional(arrow_connect(i)),
    );
}

function note(begin, end, external) {
    return choice(
        seq(
            optional(alias('/', sym('align'))),
            begin,
            alias(sym('note_position'), sym('position')),
            optional(sym('color')),
            choice(
                seq(':', optional(sym('description'))),
                seq(
                    '\n',
                    alias(repeat(alias(external, sym('line'))), sym('description')),
                    end,
                ),
            ),
        ),
    )
}
