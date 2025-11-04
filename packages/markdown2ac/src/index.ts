import { type MarkedToken, type Token, type Tokens } from 'marked';
import { AdaptiveCard, CodeBlock, Container, Image, OpenUrlAction, RichTextBlock, Table, TableCell, TableRow, TextBlock, TextRun, type CardElement, type IColumnDefinition, } from '@microsoft/teams.cards';

class ACRenderer {
    ac = new AdaptiveCard();
    needsSeparator = false;

    constructor(private parser: MarkdownToACParser) { }

    prepNewCardElement(element: CardElement) {
        this.ac.body.push(element)
        if (this.needsSeparator) {
            element.separator = true;
            this.needsSeparator = false;
        }
    }

    addSpace() {
        const lastCardElement = this.ac.body.at(-1);
        if (!lastCardElement) {
            return;
        }
        switch (lastCardElement.spacing) {
            case 'None':
                lastCardElement.spacing = 'ExtraSmall';
                break;
            case 'ExtraSmall':
                lastCardElement.spacing = 'Small';
                break;
            case 'Small':
                lastCardElement.spacing = 'Medium';
                break;
            case 'Medium':
                lastCardElement.spacing = 'Large';
                break;
            case 'Large':
                lastCardElement.spacing = 'ExtraLarge';
                break;
            default:
                // Final value (ExtraLarge) - don't do anything
                break;
        }
    }

    addHr() {
        this.needsSeparator = true;
    }

    tokenToCardElement(token: MarkedToken): CardElement | null {
        switch (token.type) {
            case 'heading': {
                let size: 'ExtraLarge' | 'Large' | 'Medium' | 'Default' | 'Small';
                switch (token.depth) {
                    case 1:
                        size = 'ExtraLarge';
                        break;
                    case 2:
                        size = 'Large';
                        break;
                    case 3:
                        size = 'Medium';
                        break;
                    case 4:
                        size = 'Default';
                        break;
                    default:
                        size = 'Small';
                        break;
                }
                const inlines = this.parser.parseInline(token.tokens);
                return new RichTextBlock().withInlines(...inlines.map(i => {
                    i.withSize(size).withWeight("Bolder")
                    return i
                }))
            }
            case 'paragraph': {
                return new RichTextBlock().withInlines(...this.parser.parseInline(token.tokens))
            }
            case 'list': {
                return new TextBlock(token.raw);
            }
            case 'code': {
                const codeBlock = new CodeBlock().withCodeSnippet(token.text);
                if (token.lang) {
                    codeBlock.withLang(token.lang);
                }
                return codeBlock;
            }
            case 'table': {
                const table = new Table();
                const headers = token.header.map(h => {
                    const headerDetail = new RichTextBlock().withInlines(...this.parser.parseInline(h.tokens))
                    const cell = new TableCell(headerDetail);
                    return cell;
                });
                const headerRow = new TableRow({ cells: headers }).withStyle('emphasis');
                const rows = token.rows.map(r => {
                    const cells = r.map(c => {
                        const textDetail = new RichTextBlock().withInlines(...this.parser.parseInline(c.tokens))
                        return new TableCell(textDetail);
                    });
                    return new TableRow({ cells });
                });
                const columns = token.header.map(() => {
                    return {} as IColumnDefinition
                })
                table.withColumns(...columns)
                table.withRows(headerRow, ...rows);
                return table;
            }
            case 'blockquote': {
                const elements: CardElement[] = [];
                for (const nestedToken of token.tokens) {
                    const element = this.tokenToCardElement(nestedToken as MarkedToken);
                    if (element) {
                        elements.push(element);
                    }
                }
                return new Container(...elements).withShowBorder(true);
            }
            case 'image': {
                const imageElement = new Image(token.href, { altText: token.title ?? token.text })
                return imageElement
            }
            case 'html': {
                return new TextBlock(token.raw)
            }
            case 'def': {
                return new RichTextBlock().withInlines(...this.parser.parseInline([{ type: 'link', text: token.title, href: token.href, raw: token.raw }]))
            }
            default:
                return null;
        }
    }

    addHeading(token: Tokens.Heading) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addParagraph(token: Tokens.Paragraph) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addList(token: Tokens.List) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addCode(token: Tokens.Code) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addTable(token: Tokens.Table) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addBlockquote(token: Tokens.Blockquote) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addImage(token: Tokens.Image) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addHtml(token: Tokens.HTML | Tokens.Tag) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    addDef(token: Tokens.Def) {
        const element = this.tokenToCardElement(token);
        if (element) this.prepNewCardElement(element);
    }

    finalize() {
        if (this.needsSeparator) {
            const container = new Container();
            container.separator = true;
            this.ac.body.push(container);
            this.needsSeparator = false;
        }
    }
}

class MarkdownToACParser {
    renderer = new ACRenderer(this)
    parse(tokens: Token[]): string {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i] as MarkedToken;
            switch (token.type) {
                case 'space':
                    this.renderer.addSpace()
                    break;
                case 'hr':
                    this.renderer.addHr()
                    break;
                case 'heading':
                    this.renderer.addHeading(token)
                    break;
                case 'code':
                    this.renderer.addCode(token)
                    break;
                case 'table':
                    this.renderer.addTable(token)
                    break;
                case 'blockquote':
                    this.renderer.addBlockquote(token)
                    break;
                case 'paragraph':
                    this.renderer.addParagraph(token)
                    break;
                case 'list':
                    this.renderer.addList(token)
                    break;
                case 'image':
                    this.renderer.addImage(token)
                    break;
                case 'html':
                    this.renderer.addHtml(token)
                    break;
                case 'def':
                    this.renderer.addDef(token)
                    break;
                default:
                    throw new Error(`Can't understand ${token.type} ${token.raw}`)
            }
        }
        this.renderer.finalize()
        return JSON.stringify(this.renderer.ac)
    }

    parseInline(tokens: Token[]): TextRun[] {
        const array: TextRun[] = []
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i] as MarkedToken;
            switch (token.type) {
                case 'text':
                case 'escape':
                    array.push(new TextRun(token.text))
                    break;
                case 'del':
                    array.push(new TextRun(token.text).withStrikethrough(true))
                    break;
                case 'strong':
                    array.push(new TextRun(token.text).withWeight('Bolder'))
                    break;
                case 'em':
                    array.push(new TextRun(token.text).withItalic(true))
                    break;
                case 'link':
                    array.push(new TextRun(token.text).withColor("Accent").withSelectAction(new OpenUrlAction(token.href)))
                    break;
                case 'codespan':
                    array.push(new TextRun(token.text).withFontType('Monospace'))
                    break;
                case 'html':
                    array.push(new TextRun(token.text).withFontType('Monospace'))
                    break;
                case 'image':
                    this.parseInline([{ type: 'link', text: token.title ?? token.text, href: token.href, raw: token.raw }])
                    break;
                default:
                    throw new Error(`Don't know how to handle inline ${token.type} ${token.raw}`)
            }
        }
        return array
    }
}

export { MarkdownToACParser, ACRenderer };
