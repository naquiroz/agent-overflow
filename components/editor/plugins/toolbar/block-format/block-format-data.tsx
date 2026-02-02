import {
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconQuote,
  IconLetterCase,
} from "@tabler/icons-react"

export const blockTypeToBlockName: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  paragraph: {
    label: "Paragraph",
    icon: <IconLetterCase className="size-4" />,
  },
  h1: {
    label: "Heading 1",
    icon: <IconH1 className="size-4" />,
  },
  h2: {
    label: "Heading 2",
    icon: <IconH2 className="size-4" />,
  },
  h3: {
    label: "Heading 3",
    icon: <IconH3 className="size-4" />,
  },
  number: {
    label: "Numbered List",
    icon: <IconListNumbers className="size-4" />,
  },
  bullet: {
    label: "Bulleted List",
    icon: <IconList className="size-4" />,
  },
  check: {
    label: "Check List",
    icon: <IconListCheck className="size-4" />,
  },
  code: {
    label: "Code Block",
    icon: <IconCode className="size-4" />,
  },
  quote: {
    label: "Quote",
    icon: <IconQuote className="size-4" />,
  },
}
