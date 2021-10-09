/* eslint-disable react/display-name */
import {
  Box,
  Button,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  useTheme,
} from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react'

import unified from 'unified'
//import createStream from 'unified-stream'
import uniorgParse from 'uniorg-parse'
import uniorg2rehype from 'uniorg-rehype'
//import highlight from 'rehype-highlight'
import katex from 'rehype-katex'
import 'katex/dist/katex.css'
import rehype2react from 'rehype-react'
import { ThemeContext } from '../../util/themecontext'
import { NodeByCite, NodeById } from '../../pages'

export interface LinkProps {
  href: any
  children: any
  previewNode?: any
  setPreviewNode: any
  setSidebarHighlightedNode: any
  nodeByCite: NodeByCite
  nodeById: NodeById
}

export interface NormalLinkProps {
  setPreviewNode: any
  nodeById: NodeById
  nodeByCite: NodeByCite
  href: any
  children: any
  setSidebarHighlightedNode: any
}

import { hexToRGBA, getThemeColor } from '../../pages/index'
import noteStyle from './noteStyle'
import { OrgImage } from './OrgImage'

export const NormalLink = (props: NormalLinkProps) => {
  const { setSidebarHighlightedNode, setPreviewNode, nodeById, href, children } = props
  const { highlightColor } = useContext(ThemeContext)

  const theme = useTheme()
  const coolHighlightColor = getThemeColor(highlightColor, theme)
  const [whatever, type, uri] = [...href.matchAll(/(.*?)\:(.*)/g)][0]
  return (
    <Text
      onMouseEnter={() => setSidebarHighlightedNode(nodeById[uri])}
      onMouseLeave={() => setSidebarHighlightedNode({})}
      tabIndex={0}
      display="inline"
      overflow="hidden"
      fontWeight={500}
      color={highlightColor}
      textDecoration="underline"
      onClick={() => setPreviewNode(nodeById[uri])}
      // TODO  don't hardcode the opacitycolor
      _hover={{ textDecoration: 'none', cursor: 'pointer', bgColor: coolHighlightColor + '22' }}
      _focus={{ outlineColor: highlightColor }}
    >
      {nodeById[uri]?.title}
    </Text>
  )
}

export const PreviewLink = (props: LinkProps) => {
  const {
    href,
    children,
    nodeById,
    setSidebarHighlightedNode,
    previewNode,
    setPreviewNode,
    nodeByCite,
  } = props
  // TODO figure out how to properly type this
  // see https://github.com/rehypejs/rehype-react/issues/25
  const [orgText, setOrgText] = useState<any>(null)
  const [whatever, type, uri] = [...href.matchAll(/(.*?)\:(.*)/g)][0]
  const [hover, setHover] = useState(false)

  const getId = (type: string, uri: string) => {
    if (type === 'id') {
      return uri
    }

    if (type.includes('cite')) {
      const node = nodeByCite[uri] ?? false
      if (!node) {
        return ''
      }
      if (node?.properties.FILELESS) {
        return ''
      }
      return node?.id
    }
    return ''
  }

  const id = getId(type, uri)
  const file = encodeURIComponent(encodeURIComponent(nodeById[id]?.file as string))

  const processor = unified()
    .use(uniorgParse)
    .use(uniorg2rehype)
    .use(katex)
    .use(rehype2react, {
      createElement: React.createElement,
      components: {
        // eslint-disable-next-line react/display-name
        a: ({ children, href }) => (
          <PreviewLink
            nodeByCite={nodeByCite}
            setSidebarHighlightedNode={setSidebarHighlightedNode}
            href={href}
            nodeById={nodeById}
            setPreviewNode={setPreviewNode}
          >
            {nodeById[id as string]?.title}
          </PreviewLink>
        ),
        img: ({ src }) => {
          return <OrgImage src={src as string} file={nodeById[id]?.file as string} />
        },
      },
    })

  const getText = () => {
    fetch(`http://localhost:35901/file/${file}`)
      .then((res) => {
        return res.text()
      })
      .then((res) => {
        if (res !== 'error') {
          const text = processor.processSync(res).result
          setOrgText(text)
          return
        }
      })
      .catch((e) => {
        console.log(e)
        return 'Could not fetch the text for some reason, sorry!\n\n This can happen because you have an id with forward slashes (/) in it.'
      })
  }

  useEffect(() => {
    if (!!orgText) {
      return
    }
    if (!hover) {
      return
    }
    getText()
  }, [hover, orgText])

  if (id) {
    return (
      <>
        <Popover gutter={12} trigger="hover" placement="top-start">
          <PopoverTrigger>
            <Box
              display="inline"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <NormalLink
                key={nodeById[id]?.title ?? id}
                {...{
                  setSidebarHighlightedNode,
                  setPreviewNode,
                  nodeById,
                  href,
                  children,
                  nodeByCite,
                }}
              />
            </Box>
          </PopoverTrigger>
          <Portal>
            <PopoverContent
              key={nodeById[id]?.title ?? id}
              boxShadow="xl"
              position="relative"
              zIndex="tooltip"
              onMouseEnter={() => {
                setSidebarHighlightedNode(nodeById[id] ?? {})
              }}
              onMouseLeave={() => {
                setSidebarHighlightedNode({})
              }}
            >
              <PopoverArrow />
              <PopoverBody
                pb={5}
                fontSize="xs"
                px={5}
                position="relative"
                zIndex="tooltip"
                maxHeight={300}
                overflow="scroll"
              >
                <Box sx={noteStyle}>{orgText}</Box>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      </>
    )
  }
  return (
    <Text display="inline" color="base.700" cursor="not-allowed">
      {children}
    </Text>
  )
}