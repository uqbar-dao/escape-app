import { Content, CodeContent, AppReference, GraphReference, GroupReference } from '@urbit/api';
import _ from 'lodash';
import { BlockContent, Content as AstContent, Parent, Root } from 'ts-mdast';
import React, { ReactNode } from 'react';
import { Image, Linking, TouchableOpacity } from 'react-native';
import { referenceToPermalink } from '../../util/permalinks';
// import { PermalinkEmbed } from '../permalinks/embed';
import { Mention } from '../MentionText';
import { parseTall, parseWide } from './parse';
import { H1, H2, H3, H4 } from '../html/Headers';
import { Text, View } from '../Themed';
import { Ol, Ul } from '../html/Lists';
import { Anchor } from '../html/Anchor';
import { Row } from '../spacing/Row';
import { Col } from '../spacing/Col';

export type PropFunc<T extends (...args: any[]) => any> = Parameters<T>[0];

type StitchMode = 'merge' | 'block' | 'inline';

// XX make better
type GraphAstNode = any;

interface GraphMentionNode {
  type: 'graph-mention';
  ship: string;
}

const addEmphasisToMention = (contents: Content[], content: Content, index: number) => {
  const prevContent = contents[index - 1];
  const nextContent = contents[index + 1];

  if (
    'text' in content &&
    (content.text.trim() === '**' || content.text.trim() === '*' )
  )  {
    return {
      text: ''
    };
  }
  if(
    'text' in content &&
    content.text.endsWith('*') &&
    !content.text.startsWith('*') &&
    nextContent !== undefined &&
    'mention' in nextContent
  ) {
    if (content.text.charAt((content.text.length - 2)) === '*') {
      return { text: content.text.slice(0, content.text.length - 2) };
    }
    return { text: content.text.slice(0, content.text.length - 1) };
  }
  if (
    'text' in content &&
    content.text.startsWith('*') &&
    !content.text.endsWith('*') &&
    prevContent !== undefined &&
    'mention' in contents[index - 1]
  ) {
    if (content.text.charAt(1) === '*') {
      return { text: content.text.slice(2, content.text.length) };
    }
    return { text: content.text.slice(1, content.text.length) };
  }
  if (
    'mention' in content &&
    prevContent !== undefined &&
    'text' in prevContent &&
    // @ts-ignore type guard above covers this.
    prevContent.text.endsWith('*') &&
    nextContent !== undefined &&
    'text' in contents[index + 1] &&
    // @ts-ignore type guard above covers this.
    nextContent.text.startsWith('*')
  ) {
    if (
      // @ts-ignore covered by typeguard in conditions
      prevContent.text.charAt(prevContent.text.length - 2) === '*' &&
      // @ts-ignore covered by typeguard in conditions
      nextContent.text.charAt(nextContent.text[1]) === '*'
    ) {
      return {
        mention: content.mention,
        emphasis: 'bold'
      };
    }
    return {
      mention: content.mention,
      emphasis: 'italic'
    };
  }
  return content;
};

const codeToMdAst = (content: CodeContent) => {
  return {
    type: 'root',
    children: [
      {
        type: 'code',
        value: content.code.expression
      },
      {
        type: 'code',
        value: (content.code.output || []).join('\n')
      }
    ]
  };
};

const contentToMdAst = (tall: boolean) => (
  content: Content
): [StitchMode, any] => {
  if ('text' in content) {
    if (content.text.toString().trim().length === 0) {
      return [
        'merge',
        { type: 'root', children: [{ type: 'paragraph', children: [] }] }
      ];
    }
    return [
      'merge',
      tall ? parseTall(content.text) : parseWide(content.text)
    ] as [StitchMode, any];
  } else if ('code' in content) {
    return ['block', codeToMdAst(content)];
  } else if ('reference' in content) {
    return [
      'block',
      {
        type: 'root',
        children: [
          {
            type: 'graph-reference',
            reference: content.reference
          }
        ]
      }
    ];
  } else if ('url' in content) {
    return [
      'block',
      {
        type: 'root',
        children: [
          {
            type: 'graph-url',
            url: content.url
          }
        ]
      }
    ];
  } else if ('mention' in content) {
    return [
      'inline',
      {
        type: 'root',
        children: [
          {
            type: 'graph-mention',
            ship: content.mention,
            emphasis: (content as any).emphasis
          }
        ]
      }
    ];
  }
  return [
    'inline',
    {
      type: 'root',
      children: []
    }
  ];
};

function stitchInline(a: any, b: any) {
  if (!a?.children) {
    throw new Error('Bad stitchInline call: missing root');
  }
  const lastParaIdx = a.children.length - 1;
  const last = a.children[lastParaIdx];
  if (last?.children) {
    const ros: any = {
      ...a,
      children: [
        ...a.children.slice(0, lastParaIdx),
        stitchInline(last, b),
        ...a.children.slice(lastParaIdx + 1)
      ]
    };
    return ros;
  }
  const res = { ...a, children: [...a.children, ...b] };
  return res;
}

function last<T>(arr: T[]) {
  return arr[arr.length - 1];
}

function getChildren<T extends unknown>(node: T): AstContent[] {
  // @ts-ignore TODO @liam-fitzgerald
  if ('children' in node) {
    // @ts-ignore TODO @liam-fitzgerald
    return node.children;
  }
  return [];
}

export function asParent<T extends BlockContent>(node: T): Parent | undefined {
  return ['paragraph', 'heading', 'list', 'listItem', 'table'].includes(
    node.type
  )
    ? (node as Parent)
    : undefined;
}

function stitchMerge(a: Root, b: Root) {
  const aChildren = a.children;
  const bChildren = b.children;
  const lastType = last(aChildren)?.type;

  if (lastType === bChildren[0]?.type) {
    const aGrandchild = getChildren(last(aChildren));
    const bGrandchild = getChildren(bChildren[0]);
    const mergedPara = {
      ...last(aChildren),
      children: [...aGrandchild, ...bGrandchild]
    };
    return {
      ...a,
      children: [...aChildren.slice(0, -1), mergedPara, ...bChildren.slice(1)]
    };
  }
  return { ...a, children: [...aChildren, ...bChildren] };
}

function stitchBlock(a: Root, b: AstContent[]) {
  return { ...a, children: [...a.children, ...b] };
}

function stitchInlineAfterBlock(a: Root, b: GraphMentionNode[]) {
  return {
    ...a,
    children: [...a.children, { type: 'paragraph', children: b }]
  };
}

function stitchAsts(asts: [StitchMode, GraphAstNode][]) {
  return _.reduce(
    asts,
    ([prevMode, ast], [mode, val]): [StitchMode, GraphAstNode] => {
      if (prevMode === 'block') {
        if (mode === 'inline') {
          return [mode, stitchInlineAfterBlock(ast, val?.children ?? [])];
        }
        if (mode === 'merge') {
          return [mode, stitchMerge(ast, val)];
        }
        if (mode === 'block') {
          return [mode, stitchBlock(ast, val?.children ?? [])];
        }
      }
      if (mode === 'inline') {
        return [mode, stitchInline(ast, val?.children ?? [])];
      }
      if (mode === 'merge') {
        return [mode, stitchMerge(ast, val)];
      }
      if (mode === 'block') {
        return [mode, stitchBlock(ast, val?.children ?? [])];
      }
      return [mode, ast];
    },
    ['block', { type: 'root', children: [] }] as [StitchMode, GraphAstNode]
  );
}
const header = ({ children, depth, ...rest }: { children: ReactNode; depth: number; }) => {
  const level = depth;
  const inner =
    level === 1 ? (
      <H1>{children}</H1>
    ) : level === 2 ? (
      <H2>{children}</H2>
    ) : level === 3 ? (
      <H3>{children}</H3>
    ) : (
      <H4>{children}</H4>
    );
  return <View {...rest}>{inner}</View>;
};

const renderers = {
  heading: header,
  break: () => {
    return <View />;
  },
  thematicBreak: () => {
    return <View style={{ width: '100%', height: 4 }}></View>;
  },
  inlineCode: ({ language, value }: any) => {
    return (
      <Text
        mono
        style={{
          padding: 2,
          backgroundColor: "rgba(0,0,0,0.03)",
          fontSize: 12,
        }}
      >
        {value}
      </Text>
    );
  },
  strong: ({ children }: any) => {
    return <Text bold> {children}</Text>;
  },
  emphasis: ({ children }: any) => {
    return <Text style={{ fontStyle: 'italic' }}> {children}</Text>;
  },
  delete: ({ children }: any) => {
    return <Text style={{ textDecorationLine: 'line-through', textDecorationStyle: 'solid' }}> {children}</Text>;
  },
  blockquote: ({ children, depth, tall, ...rest }: any) => {
    if (depth > 1) {
      return children;
    }

    return (
      <Text style={{
        lineHeight: 24,
        borderLeftWidth: 1,
        color: 'black',
        paddingLeft: 4,
        marginVertical: 2,
      }}>
        {children}
      </Text>
    );
  },
  paragraph: ({ children, collapsed = false }: any) => {
    const containerStyle = collapsed
      ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '2em' }
      : {};
    return (
      <View {...containerStyle}>
        <Text style={{ flex: 1, flexWrap: 'wrap', lineHeight: 24 }}>
          {children}
        </Text>
      </View>
    );
  },
  table: ({ children }: any) => <Col>{children}</Col>,
  tableRow: ({ children }: any) => <Row style={{ flex: 1, alignSelf: 'stretch' }}>{children}</Row>,
  tableCell: ({ children }: any) => (
    <View>
      <Text style={{ lineHeight: 24 }}>
        {children}
      </Text>
    </View>
  ),
  listItem: ({ children }: any) => {
    return <View>{children}</View>;
  },
  code: ({ language, tall, value, ...rest }: any) => {
    const inner = (
      <Text
        mono
        style={{
          // className="clamp-message"
          padding: 2,
          borderRadius: 1,
          fontSize: 12,
          backgroundColor: 'rgba(0,0,0,0.03)',
          overflow: 'scroll',
        }}
      >
        {value}
      </Text>
    );
    return tall ? <View style={{ marginBottom: 4 }}>{inner}</View> : inner;
  },
  link: (props: any) => {
    return (
      <Anchor href={props.url}>
        {props.children}
      </Anchor>
    );
  },
  list: ({ ordered, children }: { ordered: boolean; children: ReactNode }) => {
    return ordered ? <Ol>{children}</Ol> : <Ul>{children}</Ul>;
  },
  'graph-mention': (obj: any) => {
    return <Mention ship={obj.ship} emphasis={obj.emphasis} />;
  },
  image: ({ url, tall, collapsed = false }: { url: string; tall: boolean; collapsed?: boolean; }) => (
    collapsed
      ? <Text style={{ fontStyle: 'italic' }}>Image</Text>
      : <View style={{ marginTop: 2, marginBottom: 4, flexShrink: 0 }}>
        <TouchableOpacity onPress={() => Linking.openURL(url)}>
          <Image key={url} source={{ uri: url }} />
        </TouchableOpacity>
      </View>
  ),
  'graph-url': ({ url, tall, collapsed = false }: { url: string; tall: boolean; collapsed?: boolean; }) => {
    if (collapsed && /(https?:\/\/.*\.(?:png|jpg|jpeg))/i.test(url)) {
      return <Text style={{ fontStyle: 'italic' }}>Image</Text>;
    }
    return (
      <View style={{ marginTop: 2, marginBottom: 4, flexShrink: 0 }}>
        <TouchableOpacity onPress={() => Linking.openURL(url)}>
          <Image key={url} source={{ uri: url }} />
        </TouchableOpacity>
      </View>
    );
  },
  'graph-reference': ({ reference, transcluded } : { reference: AppReference | GraphReference | GroupReference; transcluded: number; }) => {
    const { link } = referenceToPermalink({ reference });
    if (transcluded > 1) {
      return null;
    }
    return (
      <View style={{ marginVertical: 4, flexShrink: 0 }}>
        <Anchor href={link}>
          {link}
        </Anchor>
      </View>
    );
  },
  root: ({ tall, children }: { tall: boolean; children: ReactNode }) =>
    tall ? (
      <View style={{ /* TODO: space these out somehow? */ }}>
        {children}
      </View>
    ) : (
      <View>{children}</View>
    ),
  text: ({ value }: { value: string }) => (
    <>
      {value.split('\n').map((v: string, idx: number) => (
        <React.Fragment key={idx}>
          {idx !== 0 ? <View /> : null}
          {v}
        </React.Fragment>
      ))}
    </>
  )
};

export function Graphdown<T extends {} = {}>(
  props: {
    ast: GraphAstNode;
    transcluded: number;
    tall?: boolean;
    depth?: number;
  } & T
) {
  const { ast, transcluded, tall, depth = 0, ...rest } = props;
  const { type, children = [], ...nodeRest } = ast;
  const Renderer = renderers[ast.type] ?? (() => `unknown element: ${type}`);

  return (
    <Renderer
      transcluded={transcluded}
      depth={depth}
      tall={tall}
      {...rest}
      {...nodeRest}
    >
      {children.map((c: ReactNode, idx: number) => (
        <Graphdown
          key={idx}
          transcluded={transcluded}
          depth={depth + 1}
          tall={tall}
          {...rest}
          ast={c}
        />
      ))}
    </Renderer>
  );
}

export type GraphContentProps = PropFunc<typeof View> & {
  tall?: boolean;
  transcluded?: number;
  contents: Content[];
  showOurContact: boolean;
  collapsed?: boolean;
};

export const GraphContent = React.memo((
  props: GraphContentProps
) => {
  const {
    contents,
    tall = false,
    transcluded = 0,
    collapsed = false,
    ...rest
  } = props;

  const [, ast] = stitchAsts(
    contents
    .map((content, index) => addEmphasisToMention(contents, content, index))
    .map(contentToMdAst(tall)));

  return (
    <View {...rest}>
      <Graphdown {...{ transcluded, ast, tall, collapsed }} />
    </View>
  );
});
