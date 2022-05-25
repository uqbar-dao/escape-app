import remark from 'remark';
import RemarkDisableTokenizers from 'remark-disable-tokenizers';
import newlines from './remark-break';
import emoji from 'emoji-dictionary';

export interface ParserSettings {
  inList: boolean;
  inBlock: boolean;
  inLink: boolean;
}

export const EMOJI_REGEX = /:[a-z0-9_]+?:/ig;
export const parseEmojis = (text: string) => text.replace(EMOJI_REGEX, match => emoji.getUnicode(match.slice(1, -1)) || match);

const DISABLED_BLOCK_TOKENS = [
  'indentedCode',
  'atxHeading',
  'thematicBreak',
  'list',
  'setextHeading',
  'html',
  'definition',
  'table'
];

const DISABLED_INLINE_TOKENS = ['autoLink', 'url', 'email', 'reference', 'html'];

const tallParser = remark().freeze();

export const parseTall = (text: string) => tallParser.parse(parseEmojis(text));

const wideParser = remark()
  .use([
    [
      RemarkDisableTokenizers,
      {
        block: DISABLED_BLOCK_TOKENS,
        inline: DISABLED_INLINE_TOKENS
      }
    ],
    // newlines
  ]);

export const parseWide = (text: string) => wideParser.parse(parseEmojis(text));
