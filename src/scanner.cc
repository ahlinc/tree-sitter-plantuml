#include <tree_sitter/parser.h>
#include <vector>
#include <string>
#include <iostream>


namespace {

using std::vector;
using std::string;

enum TokenType {
  NOP,                            // 0 - Shouldn't happen, means error.

  NOTE_DESCRIPTION,               // 1
  RNOTE_DESCRIPTION,              // 2
  HNOTE_DESCRIPTION,              // 3
  REFERENCE_DESCRIPTION,          // 4
  TITLE_DESCRIPTION,              // 5

  EXTERNAL_TOKEN_COUNT,
};

inline void skip(TSLexer *lexer) {
  lexer->advance(lexer, true);
}

inline void advance(TSLexer *lexer) {
  lexer->advance(lexer, false);
}

typedef void (*LexerAction)(TSLexer*);
typedef uint32_t epoch_t;

struct Scanner {

  unsigned serialize(char *buffer) {
    return 0;
  }

  void deserialize(const char *buffer, unsigned length) {

  }

  inline unsigned lex_spaces(TSLexer *lexer, LexerAction lexer_action) {
    unsigned i = 0;
    while (
      lexer->lookahead == ' ' ||
      lexer->lookahead == '\t' ||
      lexer->lookahead == '\v'
    ) {
      lexer_action(lexer); i++;
    }
    return i;
  }

  inline unsigned lex_whitespaces(TSLexer *lexer, LexerAction lexer_action) {
    unsigned i = 0;
    while (
      lexer->lookahead == ' '||
      lexer->lookahead == '\t' ||
      lexer->lookahead == '\v' ||
      lexer->lookahead == '\n'
    ) {
      lexer_action(lexer); i++;
    }
    return i;
  }

  bool scan_description(TSLexer *lexer, vector<string> & end, TokenType token, LexerAction space_prefix_action) {
    if (lexer->lookahead == '\n') skip(lexer);
    lex_spaces(lexer, space_prefix_action);

    for (unsigned i = 0; i < end.size(); i++) {
      auto s = end[i];
      for (unsigned j = 0; j < s.size(); j++) {
        // std::cout << "S1: " << (char) lexer->lookahead << " " << s[j] << " " << i << " " << j << "\n";
        if (lexer->lookahead != s[j]) goto description;
        advance(lexer);
      }
      lex_spaces(lexer, skip);
    }
    return false;

  description:
    while (lexer->lookahead != '\n') {
      if (lexer->lookahead == '\0') return false;
      advance(lexer);
    }
    lexer->result_symbol = token;
    return true;
  }

  bool scan(TSLexer *lexer, const bool *valid_symbols) {
    if (lexer->lookahead == '\0') return false;
    if (valid_symbols[NOP]) return false;

    if (valid_symbols[NOTE_DESCRIPTION]) {
      if (scan_description(lexer, end_note, NOTE_DESCRIPTION, advance))
        return true;
    }

    if (valid_symbols[RNOTE_DESCRIPTION]) {
      if (scan_description(lexer, endrnote, RNOTE_DESCRIPTION, advance))
        return true;
    }

    if (valid_symbols[HNOTE_DESCRIPTION]) {
      if (scan_description(lexer, endhnote, HNOTE_DESCRIPTION, advance))
        return true;
    }

    if (valid_symbols[REFERENCE_DESCRIPTION]) {
      if (scan_description(lexer, end_ref, REFERENCE_DESCRIPTION, advance))
        return true;
    }

    if (valid_symbols[TITLE_DESCRIPTION]) {
      if (scan_description(lexer, end_title, TITLE_DESCRIPTION, skip))
        return true;
    }

    return false;
  }

  vector<string> end_note { "end", "note" };
  vector<string> endrnote { "endrnote" };
  vector<string> endhnote { "endhnote" };
  vector<string> end_ref { "end", "ref" };
  vector<string> end_title { "end", "title" };
};

}

extern "C" {

void *tree_sitter_plantuml_external_scanner_create() {
  return new Scanner();
}

bool tree_sitter_plantuml_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->scan(lexer, valid_symbols);
}

unsigned tree_sitter_plantuml_external_scanner_serialize(void *payload, char *state) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->serialize(state);
}

void tree_sitter_plantuml_external_scanner_deserialize(void *payload, const char *state, unsigned length) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  scanner->deserialize(state, length);
}

void tree_sitter_plantuml_external_scanner_destroy(void *payload) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  delete scanner;
}

}
