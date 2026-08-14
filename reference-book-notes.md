# Reference poetry book layout notes

Source: `/home/ubuntu/upload/검토용)시절시집_다가올시간에윙크윙크_본문(3).pdf`

Pages 1-5 visual findings:

The book uses a tall, narrow page proportion with very generous outer margins and a compact central text block. Body text sits noticeably above the vertical center, leaving a large amount of quiet white space below on many pages. Decorative corner crop-mark-like line elements appear near all four corners and contribute to a print-proof feeling.

The title and section headings are restrained rather than large. On the opening essay spread, headings are centered and light, with accent color used sparingly in green for display text. The running text is dark gray to black, set in a serif-like Korean book face with relatively small size and comfortable but not loose leading.

Page numbers are small and low-contrast, placed near the bottom outer corner rather than centered. Paragraphs show first-line indentation in prose pages, while the poem pages in the text extract indicate a narrow measure and strong respect for line breaks. The overall impression is not a card floating on a webpage but a proof or bound page with a stable page frame, thin ornament, and controlled text block width.

Pages 15-19 visual findings (poem body pages):

Representative poem pages confirm that the live site should move closer to a true page composition. The poem title appears modest in size, aligned with the left edge of the text block rather than oversized. The text block begins high on the page with a broad top margin, and each poem line sits inside a narrow, left-aligned column that occupies only a small portion of the total page width. The surrounding white space is intentionally dominant.

Line spacing is calm and even, with each logical line clearly separated but not theatrically loose. Stanza gaps are larger than a normal line break, usually around one additional line of breathing room. The outer page number is tiny and sits near the lower outer edge. There is no heavy border, card chrome, or strong shadow; instead the page relies on proportion, thin corner marks, and quiet margins to feel book-like.

For the website, the key implications are a taller page frame, smaller title scale, a narrower poem measure, lighter decoration, lower-contrast page furniture, and a text block anchored higher with substantial bottom breathing room.

Pages 2-6 visual findings (page-type calibration set):

The front-matter title page uses a much looser composition than poem pages. Display text is set in a brighter green accent and occupies a smaller vertical band, while contributor names are grouped lower on the page in a compact block. This indicates that cover-like and section-opening pages should not share the same body tokens as poem reading pages.

The opening prose pages confirm a wider text block than poem pages. The prose measure appears roughly one-third wider, with steady first-line paragraph indentation, slightly denser leading than poem pages, and a text block that begins near the upper-middle rather than very high. The final page of the opening note introduces a deliberate large empty lower half, showing that sparse pages should preserve vertical breathing room instead of stretching text to fill the frame.

For calibration, the working page-type list should be: poem title/first page, dense continuing poem page, sparse continuing poem page, prose or start-note page, and front-matter/title-like page. Each needs its own text-block width, top offset, and maximum font-size token.

Page-specific token QA notes:

The updated WorkPage now classifies each physical PAGE_BREAK block rather than applying one global font/measure. First pages use a slightly more open title composition; sparse poem pages receive a larger top offset and preserved white space; dense poem pages use a slightly wider text column with a marginally smaller font and tighter leading; standard poem pages sit between those values; essay pages use the widest column and paragraph indentation.

At 1280px and 390px, the representative Spiritus page retains the narrow printed column, calmer small type, and no horizontal overflow. The page frame continues to fill the reading width while the text block remains intentionally smaller, matching the reference book's strong white-space ratio.

Tablet QA:

At 768px, the page-specific rules keep the text column proportionally narrow while allowing longer logical lines to flow naturally. The title remains modest, the top offset is controlled, and the page frame has no horizontal overflow. Compared with the original global treatment, the body is less oversized and the whitespace ratio is closer to the reference pages.
