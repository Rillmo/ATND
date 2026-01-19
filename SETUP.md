# ATND Setup

## 1) Supabase 준비
1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. 프로젝트 Settings → API 키에서 아래 값 확인

## 2) 환경 변수
`.env.local`을 만들고 아래 값을 채워주세요.

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_strong_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 3) 실행
```
npm install
npm run dev
```

## 참고
- 이메일 로그인은 `회원가입` 화면에서 계정을 만든 후 사용하세요.
- 매니저만 일정 생성/수정/삭제, 출석 현황 조회가 가능합니다.
- 출석 체크는 브라우저 위치 권한이 필요합니다.
- 일정 생성 화면의 장소 검색은 Google Maps JavaScript API + Places API가 필요합니다.

## 추가: 약관/개인정보 동의 컬럼
기존 DB를 사용 중이라면 아래 SQL을 추가로 실행하세요.

```
alter table users
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz;
```
