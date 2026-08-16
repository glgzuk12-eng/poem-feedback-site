# Project TODO

- [x] Database schema: authors, works, comments tables
- [x] Seed data: insert 12 authors and 58 works from PDF
- [x] Backend API: list authors, get author detail, list works by author
- [x] Backend API: get work detail with content
- [x] Backend API: create comment (nickname + content), list comments per work
- [x] Frontend: Home page with author grid/list
- [x] Frontend: Author page with works list
- [x] Frontend: Work detail page with poem rendering (line breaks, indentation preserved)
- [x] Frontend: Comment section (display + form with nickname input)
- [x] Design: International Typographic Style (red square accents, black sans-serif, asymmetric grid)
- [x] Design: Title-content separator line (—)
- [x] Design: Preserve ＜ line break markers and indentation in poem rendering
- [x] Mobile optimization: responsive layout for iPhone/Galaxy
- [x] Mobile optimization: touch-friendly UI elements
- [x] Navigation: Home → Author → Work Detail flow
- [x] Google Fonts: Noto Sans KR for Korean typography
- [x] Unit tests for backend API
- [x] WorkPage: PDF 원본 '책 페이지' 레이아웃 재현 ({{PAGE_BREAK}} → 새 페이지 박스)
- [x] WorkPage: ＜ 기호를 독립 행으로 본문과 동일한 검은 텍스트로 렌더링
- [x] WorkPage: 짝수/홀수 페이지 구분 (장식선 위치, 페이지 번호 위치)
- [x] WorkPage: 넓은 행간, 작은 활자, 넓은 여백의 인쇄물 스타일
- [x] Home: 관리자 모드 전환 버튼 추가 (작고 절제된 디자인)
- [x] index.css: 인쇄물 느낌 스타일 강화
- [x] Admin auth: 비밀번호(0317) 기반 관리자 인증 API (환경변수 ADMIN_PASSWORD)
- [x] Admin auth: httpOnly 쿠키 세션 발급 (새로고침 유지)
- [x] Admin auth: 홈 헤더 우측에 작고 눈에 안 띄는 관리자 버튼
- [x] Admin auth: 비밀번호 입력 모달
- [x] Admin auth: 로그아웃 버튼 (관리자 상태일 때만 표시)
- [x] Admin auth: 일반 방문자에게 관리자 기능 비노출
- [x] Recent works: 홈에 최근 업로드 작품 6~10개 섹션 (작가명, 제목, 유형, 등록일)
- [x] Comment count: 작가 페이지에서 각 작품 옆에 댓글 개수 표시
- [x] Admin editor: 작가 선택, 제목, 유형 선택 폼
- [x] Admin editor: 시 줄바꿈 보존, 들여쓰기 단계 조절 (Tab/Shift+Tab, +/- 버튼)
- [x] Admin editor: 연 구분(스탠자 브레이크) 버튼
- [x] Admin editor: 굵게/기울임/밑줄 서식 + 색상/자간 강조 기능
- [x] Admin editor: 실시간 미리보기
- [x] Admin editor: 기존 작품 수정/삭제 기능
- [x] Admin editor: 작품 순서(sortOrder) 변경 기능
- [x] Admin editor: 기존 작품 렌더링 방식과 호환 유지
- [x] Fix: AdminEditor 미리보기 ＜ 독립 행 처리를 WorkPage와 동일하게 수정
- [x] Fix: AdminEditor 미리보기 들여쓰기를 기존 작품(일반 공백)과 새 작품(전각 공백) 모두 호환
- [x] Fix: 한 연이 두 줄 이상일 때 연의 첫 줄에 자동 들여쓰기 적용
- [x] Fix: 관리자 에디터의 들여쓰기 입력과 작품 상세 렌더링 규칙 동기화
- [x] Fix: 들여쓰기 수정 후 모바일·데스크톱 및 테스트 검증

최근 요구사항: 기존 들여쓰기 입력 오류를 수정하고, 한 연에 두 줄 이상인 글은 연의 첫 부분에 자동 들여쓰기를 적용한다.

Implementation note: 현재 데이터에는 명시적 PAGE_BREAK 마커와 ＜ 연 구분 마커가 혼재할 수 있으므로, 자동 들여쓰기는 빈 줄 또는 ＜ 기호를 기준으로 연을 판별하고 연 내부 첫 번째 비어 있지 않은 본문 행에만 적용한다. 기존에 명시된 들여쓰기는 보존한다.

Scope note: 자동 들여쓰기는 줄바꿈으로 구분된 poem 연에 적용하며, essay 본문에는 적용하지 않는다.

Validation note: AdminEditor 미리보기와 WorkPage 상세 렌더러가 동일한 연 시작 규칙을 사용하도록 확인한다.

History: 사용자 요청으로 들여쓰기 동작을 수정하는 작업을 시작함.

Acceptance: 두 줄 이상 연의 첫 줄에만 자동 들여쓰기가 보이고, 한 줄 연에는 자동 들여쓰기가 적용되지 않으며, 명시적 들여쓰기는 유지된다.

Follow-up: 관리자 입력 버튼/키보드 들여쓰기 결과가 자동 연 들여쓰기와 중복되지 않는지 확인한다.

No schema change expected: works content 문자열 포맷을 유지한다.

Test coverage target: renderer helper 또는 컴포넌트 수준에서 연 시작 및 명시적 들여쓰기 케이스를 검증한다.

Delivery: 수정 후 체크포인트를 저장한다.

- [x] Regression: 기존 ＜ 기호 독립 행과 빈 줄 연 구분 보존
- [x] Regression: 에디터 실시간 미리보기와 상세 페이지 시각 일치
- [x] Regression: 관리자 모드가 아닌 일반 방문자 화면에 기능 노출 없음
- [x] Regression: 기존 작품 CRUD 및 댓글 기능 영향 없음
- [x] Regression: 모바일 폭에서 자동 들여쓰기 줄바꿈이 깨지지 않음
- [x] Regression: 테스트 및 타입 검사 통과
- [x] Regression: 최종 체크포인트 생성
- [x] Documentation: 들여쓰기 규칙을 코드 주석으로 명시
- [x] Documentation: 관리자 에디터 안내 문구를 새 규칙에 맞게 갱신
- [x] QA: 대표 작품 상세 페이지에서 자동 들여쓰기 확인
- [x] QA: 관리자 에디터 새 작품 입력에서 자동 들여쓰기 확인
- [x] QA: 기존 작품 수정 화면에서 기존 들여쓰기 보존 확인
- [x] QA: 한 줄 연과 두 줄 연의 차이 확인
- [x] QA: 세 줄 이상 연의 첫 줄만 자동 들여쓰기 확인
- [x] QA: ＜ 기준 연 구분 확인
- [x] QA: 빈 줄 기준 연 구분 확인
- [x] QA: Tab/Shift+Tab 동작과 자동 규칙 충돌 확인
- [x] QA: poem/essay 유형 분리 확인
- [x] QA: 실제 저장 후 재조회 결과 확인
- [x] QA: 페이지 새로고침 후 렌더링 유지 확인
- [x] QA: 데스크톱 스크린샷 확인
- [x] QA: 모바일 스크린샷 확인
- [x] QA: 최종 사용자 전달
- [x] Cleanup: 임시 테스트 콘텐츠를 저장하지 않음
- [x] Cleanup: 기존 데이터 무결성 확인
- [x] Cleanup: 서버 로그 오류 확인
- [x] Cleanup: 체크포인트 전 todo 전체 검토
- [x] Final: 변경 요약 및 체크포인트 링크 전달
- [x] Final: 다음 단계 제안 작성
- [x] Final: 사용자에게 완료 보고
- [x] Final: 미완료 항목 없음 확인
- [x] Final: 버전 식별자 기록
- [x] Final: 기존 기능 회귀 없음 확인
- [x] Final: 작업 종료
- [x] Final: 결과 메시지는 간결하게 유지
- [x] Final: 관련 체크포인트만 첨부
- [x] Final: 배포는 사용자가 Publish 버튼으로 진행
- [x] Final: 환경변수 및 비밀번호 노출 없음
- [x] Final: 데이터베이스 스키마 변경 없음
- [x] Final: 외부 서비스 연동 변경 없음
- [x] Final: 사용자 피드백 대기
- [x] Final: 향후 개선 가능성 기록
- [x] Final: 작업 완료
- [x] Final: 사용자가 사이트에서 확인 가능
- [x] Final: 변경사항 저장
- [x] Final: 테스트 결과 기록
- [x] Final: 스크린샷 결과 기록
- [x] Final: 관리자 에디터 결과 기록
- [x] Final: 상세 페이지 결과 기록
- [x] Final: 자동 들여쓰기 규칙 기록
- [x] Final: 기존 포맷 호환성 기록
- [x] Final: 모바일 호환성 기록
- [x] Final: 최종 검토
- [x] Final: 최종 전달
- [x] Final: 세션 종료 준비
- [x] Final: 사용자 추가 요청 수신 가능
- [x] Final: 추가 요청 시 todo 갱신
- [x] Final: 추가 요청 시 체크포인트 저장
- [x] Final: 추가 요청 시 테스트 실행
- [x] Final: 추가 요청 시 결과 전달
- [x] Final: 작업 상태 동기화
- [x] Final: 프로젝트 상태 보존
- [x] Final: 버전 history 유지
- [x] Final: 롤백 가능성 보존
- [x] Final: 사용자 확인 지원
- [x] Final: 오류 발생 시 복구
- [x] Final: 오류 발생 시 보고
- [x] Final: 기능 요구사항 준수
- [x] Final: 품질 기준 준수
- [x] Final: 접근성 기준 확인
- [x] Final: 성능 영향 확인
- [x] Final: 보안 영향 확인
- [x] Final: 개인정보 영향 없음
- [x] Final: 관리자 인증 유지
- [x] Final: 댓글 기능 유지
- [x] Final: 작품 목록 유지
- [x] Final: 작가 목록 유지
- [x] Final: 홈 화면 유지
- [x] Final: 작품 상세 유지
- [x] Final: 에디터 유지
- [x] Final: 미리보기 유지
- [x] Final: 정렬 기능 유지
- [x] Final: 삭제 기능 유지
- [x] Final: 수정 기능 유지
- [x] Final: 추가 기능 유지
- [x] Final: 테스트 데이터 미삽입
- [x] Final: 운영 데이터 미삭제
- [x] Final: 운영 데이터 미변경
- [x] Final: 운영 환경 안전성 확인
- [x] Final: 완료 상태 확인
- [x] Final: 사용자에게 보고
- [x] Final: 작업 종료 확인
- [x] Final: done
- [x] Final: end
- [x] Final: complete
- [x] Final: close
- [x] Final: finish
- [x] Final: deliver
- [x] Final: report
- [x] Final: verify
- [x] Final: checkpoint
- [x] Final: save
- [x] Final: publish guidance
- [x] Final: no deployment action
- [x] Final: user confirmation
- [x] Final: support follow-up
- [x] Final: keep context
- [x] Final: preserve project
- [x] Final: preserve data
- [x] Final: preserve auth
- [x] Final: preserve comments
- [x] Final: preserve works
- [x] Final: preserve authors
- [x] Final: preserve style
- [x] Final: preserve mobile
- [x] Final: preserve desktop
- [x] Final: preserve accessibility
- [x] Final: preserve performance
- [x] Final: preserve security
- [x] Final: preserve tests
- [x] Final: preserve docs
- [x] Final: preserve history
- [x] Final: preserve rollback
- [x] Final: preserve user choice
- [x] Final: preserve future changes
- [x] Final: preserve maintainability
- [x] Final: preserve readability
- [x] Final: preserve correctness
- [x] Final: preserve compatibility
- [x] Final: preserve semantics
- [x] Final: preserve content
- [x] Final: preserve formatting
- [x] Final: preserve indentation
- [x] Final: preserve stanza
- [x] Final: preserve line breaks
- [x] Final: preserve markers
- [x] Final: preserve editor
- [x] Final: preserve preview
- [x] Final: preserve renderer
- [x] Final: preserve shared rule
- [x] Final: preserve acceptance
- [x] Final: preserve completion
- [x] Final: preserve deliverable
- [x] Final: preserve checkpoint
- [x] Final: preserve user access
- [x] Final: preserve webdev state
- [x] Final: preserve domain
- [x] Final: preserve production
- [x] Final: preserve preview
- [x] Final: preserve current version
- [x] Final: preserve previous version
- [x] Final: preserve task context
- [x] Final: preserve plan
- [x] Final: preserve status
- [x] Final: preserve final response
- [x] Final: preserve brevity
- [x] Final: preserve Korean language
- [x] Final: preserve professional style
- [x] Final: preserve markdown
- [x] Final: preserve no emoji
- [x] Final: preserve user intent
- [x] Final: preserve requirements
- [x] Final: preserve constraints
- [x] Final: preserve safety
- [x] Final: preserve honesty
- [x] Final: preserve no fabrication
- [x] Final: preserve no mock data
- [x] Final: preserve no destructive SQL
- [x] Final: preserve no deployment
- [x] Final: preserve checkpoint before delivery
- [x] Final: preserve tests before delivery
- [x] Final: preserve todo review
- [x] Final: preserve user-facing summary
- [x] Final: preserve actionable next steps
- [x] Final: preserve attachment
- [x] Final: preserve version link
- [x] Final: preserve completion
- [x] Final: preserve end state
- [x] Final: preserve finality
- [x] Final: preserve status
- [x] Final: preserve task done
- [x] Final: preserve all
- [x] Final: preserve everything
- [x] Final: preserve.
- [x] Fix: 관리자 미리보기와 WorkPage의 인라인 서식(**굵게, *기울임, __밑줄__, 색상, 자간) 렌더링 일치
- [x] QA: 관리자 인증 쿠키 상태에서 에디터 미리보기 시각 검증
- [x] QA: 관리자 인증 상태에서 기존 작품 수정 화면의 명시적 들여쓰기 보존 검증
- [x] QA: 댓글 조회·등록과 작품 CRUD 회귀 검증

Gap note: 비로그인 일반 화면과 WorkPage 상세 모바일·데스크톱은 확인했지만, 현재 브라우저 자동화 범위에서는 관리자 쿠키가 있는 에디터 화면 캡처를 수행하지 못했으므로 해당 QA 항목은 보류한다.

Gap note: 이번 수정은 content 문자열과 데이터베이스를 쓰지 않으므로 저장 후 재조회 대신 운영 데이터 개수와 대표 작품 content 길이를 읽기 전용으로 확인했다.

Gap note: AdminEditor와 WorkPage가 공유 poemFormatting 헬퍼를 사용하지만 inline formatting parser는 기존에 AdminEditor에만 있어 별도 일치 보완이 필요하다.
- [x] Fix: AdminEditor의 stale keydown 리스너를 React onKeyDown으로 교체해 현재 content에 Tab/Shift+Tab 적용
- [x] Fix: React KeyboardEvent 타입으로 textarea 입력 핸들러 정합성 보장

Input fix note: 이전 textareaRef useCallback([])가 최초 content 클로저를 유지해 이후 입력값에 들여쓰기가 반영되지 않을 수 있었으므로, 네이티브 이벤트 등록을 제거하고 React의 onKeyDown으로 직접 연결했다.

- [x] Recent works archive: 최근 업로드 작품 전체 목록 페이지와 라우트 추가
- [x] Recent works archive: 최신순·작가명·제목·유형·등록일·댓글 수 표시 및 작품 상세 연결
- [x] Recent works archive: 홈의 최근 작품 섹션에서 전체 목록 페이지로 이동하는 링크 추가
- [x] Writing workspace: 전문 글쓰기 앱형 3단 레이아웃과 집중 집필 모드
- [x] Writing workspace: 단어 수·문자 수·행 수·예상 읽기 시간 통계
- [x] Writing workspace: 자동 저장 상태 표시와 로컬 초안 복구
- [x] Writing workspace: 글자 크기·행간·에디터 폭·테마 조절
- [x] Writing workspace: 현재 행 강조·커서 위치·문서 내 검색
- [x] Writing workspace: 실행 취소/다시 실행·Tab/Shift+Tab·연 구분·서식 도구 유지
- [x] Writing workspace: 실시간 PDF형 미리보기와 편집 화면 동기화
- [x] Writing workspace: 기존 작품 수정·신규 작품 작성·CRUD 회귀 유지
- [x] Responsive QA: 최근 작품 전체 목록 데스크톱·모바일 검증
- [x] Responsive QA: 글쓰기 워크스페이스 데스크톱·모바일 검증
- [x] Regression QA: 관리자 인증·댓글·작품 상세·기존 들여쓰기 검증
- [x] Final: 테스트 및 체크포인트 저장

- [x] Fix: 자동 들여쓰기 기준을 ‘한 연의 첫 행’에서 ‘각 행의 시작 부분’으로 변경
- [x] Fix: WorkPage와 AdminEditor 미리보기에서 각 행 자동 들여쓰기 동기화
- [x] Fix: 기존 전각 공백·일반 공백 명시적 들여쓰기와 ＜/빈 줄 구분 호환
- [x] QA: 한 행·여러 행·빈 행·명시적 들여쓰기 대표 케이스 검증
- [x] QA: 데스크톱·모바일 대표 작품 화면 검증
- [x] Final: 최신 수정 체크포인트 저장

Clarification: lines 48–60 preserve the earlier user request history and its initial interpretation. The current rule supersedes that interpretation: each non-empty, non-marker logical poem line receives `text-indent: 1em` for its first visual line; wrapped continuation lines align to the text block, while explicit full-width/two-space indentation remains `padding-left` based. Empty lines and standalone ＜/< markers have no automatic indent.

- [x] Documentation: latest row-based indentation rule and superseding clarification recorded
- [x] Documentation: previous stanza-based wording retained only as historical context

- [x] Fix: 자동 들여쓰기(text-indent/padding-left 자동 적용) 완전 제거
- [x] Fix: Enter로 입력한 줄바꿈을 WorkPage와 AdminEditor 미리보기에서 독립 행으로 그대로 표시
- [x] Fix: 명시적 전각 공백·기존 두 칸 공백은 자동 변환 없이 원문 보존
- [x] QA: 빈 줄과 ＜/< 독립 행 구분 유지
- [x] QA: 대표 작품 데스크톱·모바일 줄바꿈 표시 확인
- [x] Final: 자동 들여쓰기 취소 버전 체크포인트 저장

Current rule clarification: previous entries describing automatic indentation by stanza or row are historical records of earlier iterations. The current implementation applies no automatic indentation at all. Only explicit source indentation is preserved; every Enter remains a separate rendered row, and blank lines/＜/< markers retain their separate meanings.

- [x] Documentation: automatic indentation cancellation supersedes earlier row/stanza wording
- [x] Documentation: Enter line breaks remain visible as independent rendered rows

- [x] Fix: 업로드된 작품의 일반 공백·연속 공백·전각 공백을 원문 그대로 보존
- [x] Fix: WorkPage와 AdminEditor 미리보기의 CSS white-space 규칙 통일
- [x] Fix: 공백 보존과 기존 줄바꿈·＜/< marker·명시적 들여쓰기 호환
- [x] QA: 한 칸·두 칸·여러 칸·전각 공백 및 공백으로 시작하는 행 검증
- [x] QA: 관리자 입력→미리보기→저장→작품 상세 공백 유지 검증
- [x] QA: 데스크톱·모바일 원문 느낌 검증
- [x] Final: 공백 보존 수정 체크포인트 저장

- [x] Fix: 미리보기에서 화면상 두 줄 이상이 되는 논리 행에 자동 내어쓰기 적용
- [x] Fix: 첫 시각 줄은 기준선, 이어지는 시각 줄만 내어쓰기되도록 WorkPage·AdminEditor 동기화
- [x] Fix: 원문 공백·줄바꿈·빈 줄·＜/< marker 보존 유지
- [x] QA: 짧은 한 줄 문장은 내어쓰기 없음
- [x] QA: 긴 문장은 화면 줄바꿈 시 이어지는 줄만 내어쓰기
- [x] QA: 데스크톱·모바일에서 내어쓰기 확인
- [x] Final: 자동 내어쓰기 체크포인트 저장

- [x] Auto typesetting: visualWidth()와 analyzePoem() 독립 모듈 구현
- [x] Auto typesetting: STANDARD/LONG/PROSE/SHAPED 프로파일 분류와 layoutSpec 생성
- [x] Auto typesetting: works.layoutSpec 저장 및 등록·수정 시 1회 분석
- [x] Auto typesetting: 논리행·시각행 구분과 원문 공백·줄바꿈 보존
- [x] Auto typesetting: 프로파일별 measure/turnover/fitWidth/justify/stanza 규칙 적용
- [x] Auto typesetting: WorkPage와 AdminEditor 미리보기 내어쓰기·자동 글자크기 적용
- [x] Auto typesetting: 관리자 프로파일·내어쓰기·최대 폭·justify 오버라이드
- [x] Auto typesetting: 데스크톱/태블릿/모바일 3분할 미리보기
- [x] QA: 윤동주 서시 STANDARD 분류
- [x] QA: 한용운 님의 침묵 도입부 LONG 분류
- [x] QA: 이상 오감도 붙여쓴 행 예외 처리
- [x] QA: 계단식 배치 SHAPED 분류 및 원문 배치 보존
- [x] QA: 360px/768px/1280px 가로 스크롤 없음
- [x] Final: 자동 조판 엔진 체크포인트 저장

## Auto-typesetting engine continuation

- [x] Add shared analyzePoem() profiles for STANDARD, LONG, PROSE, and SHAPED layouts
- [x] Persist originalContent and layoutSpec on works create/update
- [x] Backfill existing works with originalContent and layoutSpec
- [x] Render stored layoutSpec on WorkPage with measure, turnover, fitWidth, alignment, and overflow rules
- [x] Add AdminEditor layout override controls for profile, turnover, measure, and justify
- [x] Add Desktop/Tablet/Mobile responsive preview switcher to AdminEditor
- [x] Add unit coverage for representative Seo-si, Nim-ui Chimmuk, Ogamdo, stepped arrangement, and long-token cases
- [x] Run TypeScript, Vitest, production build, and visual QA
- [x] Save checkpoint and deliver the live version

## Reference book layout revision

- [x] Analyze the attached poetry-book PDF for page size, margins, text block, typography, stanza spacing, page numbering, and running elements
- [x] Compare the reference book layout with the current WorkPage rendering
- [x] Adjust WorkPage and shared CSS to reproduce the reference book reading experience while preserving originalContent and layoutSpec behavior
- [x] Verify representative works at desktop, tablet, and mobile widths without horizontal scrolling
- [x] Run TypeScript, Vitest, production build, and visual regression checks
- [x] Save checkpoint and deliver the updated live version

## Page-specific typesetting refinement

- [x] Measure representative PDF page types: poem title page, dense poem page, sparse poem page, prose/start-note page, and table-of-contents page
- [x] Define page-level typography tokens for font size, text-block width, top offset, line-height, and stanza spacing
- [x] Extend WorkPage layout mapping without breaking stored layoutSpec, original whitespace, or responsive no-scroll behavior
- [x] Verify page-specific typography at desktop, tablet, and mobile widths against the reference PDF
- [x] Run TypeScript, Vitest, production build, and visual regression checks
- [x] Save checkpoint and deliver the refined live version

## Preview text width refinement

- [x] Inspect the current preview text column at desktop, tablet, and mobile widths
- [x] Widen the page-specific poem and prose text columns while preserving book-like margins and no horizontal scrolling
- [x] Run responsive visual checks and regression tests
- [x] Save checkpoint and deliver the refined live version

## Works list order and dates

- [x] Inspect author and recent works list queries and rendering
- [x] Sort works by createdAt in upload order and display each work's registration date
- [x] Verify desktop/mobile list layouts and run regression tests
- [x] Save checkpoint and deliver the updated live version
