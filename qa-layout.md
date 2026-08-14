# Auto-typesetting QA notes

The WorkPage screenshot for `/work/kim-seungwook-2-spiritus` rendered the stored layout specification on both desktop (1280px) and mobile (390px) viewports. The book-page frame remained within the viewport, logical poem lines stayed separated, stanza spacing remained visible, and the mobile view did not introduce horizontal scrolling. The shared CSS variables controlled the measure and line wrapping while the body font scaled down for the narrower container.

The home, recent-work archive, and unauthenticated `/admin/editor` screenshots also rendered successfully. The admin route remained protected for a non-admin session, so editor controls were not exposed in that capture.

Automated coverage includes Seo-si-like standard lines, long lines for Nim-ui Chimmuk-like prose, an Ogamdo-like standard poem sample, a stepped SHAPED arrangement, and a long unbroken token overflow case.
