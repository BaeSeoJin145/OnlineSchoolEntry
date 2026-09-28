# 온라인 출입 시스템 | Online Entry System

[English](#english)

학생의 교내 출입을 요청하고, 교사가 승인한 뒤 QR 코드로 실제 출입 시간을 기록하는 웹 앱입니다.

## 주요 기능

- 학생: 출입 요청 제출 및 QR 출입증 생성
- 교사: 이메일과 비밀번호로 로그인하고 날짜, 학년, 승인 상태, 사용 상태로 요청 검색
- 교사: 선택한 학생들의 출입 요청 일괄 승인
- 출입 확인: QR 코드로 출입증을 열어 승인 상태를 확인하고 입·퇴실 시간 기록
- 데이터 저장: Firebase Realtime Database

## 사용 기술

- HTML, CSS, JavaScript (ES modules)
- Firebase JavaScript SDK 10.8.1 및 Realtime Database
- QRCode.js 1.0.0

## 실행

빌드 단계가 없는 정적 웹 앱입니다. 프로젝트 디렉터리에서 로컬 HTTP 서버를 실행한 뒤 브라우저에서 엽니다. 예를 들어 Python이 설치되어 있다면:

```bash
python3 -m http.server 8000
```

그다음 `http://localhost:8000`에 접속합니다. ES modules와 외부 Firebase SDK를 사용하므로 파일을 직접 여는 방식(`file://`) 대신 HTTP(S) 서버를 사용하세요. QR 출입증은 현재 `https://onlineschoolentry.netlify.app/guard.html` 주소를 가리키므로, 다른 도메인에 배포할 때는 `student.html`의 QR URL도 배포 주소에 맞게 변경해야 합니다.

## Firebase 데이터 구조

앱은 Realtime Database에서 다음 경로를 사용합니다.

```text
teacher/{teacherKey}
  name: string
  email: string
  password: string

class/{grade}-{class}/{studentId}/{YYYY-MM-DD}
  name: string
  reason: string
  teacher: string
  accept: boolean
  realEnter: boolean
  enterTime: string
  leaveTime: string
```

`studentId`는 학년 및 반을 추출할 수 있는 형식이어야 하며, 학생 요청을 제출하기 전에 해당 ID가 `class` 경로에 등록되어 있어야 합니다. 예시 스키마는 코드에서 사용하는 필드에 기반한 설명이며, 실제 Firebase 데이터 및 보안 규칙에 맞춰 구성해야 합니다.

## 파일 구성

```text
index.html       시작 페이지
student.html     학생 요청 및 QR 생성
teacher.html     교사 로그인 및 요청 관리
guard.html       QR 출입증 확인 및 출입 기록
style.css        공통 스타일
script/app.js    Firebase 연동 및 화면 동작
script/site.webmanifest  웹 앱 manifest
```

## 배포 및 설정 참고

- Firebase 프로젝트 설정은 `script/app.js`에 포함되어 있습니다. 본인 Firebase 프로젝트를 사용하려면 해당 설정과 Realtime Database 규칙을 함께 확인하세요.
- 교사 인증은 현재 Realtime Database의 이메일/비밀번호 값을 조회하는 방식입니다. 공개 배포 전에는 Firebase Authentication과 적절한 Database 보안 규칙을 사용하는 구조로 전환하세요.
- Firebase 접근은 배포 도메인의 보안 규칙과 허용 설정에 따라 달라집니다. 실제 데이터베이스는 필요한 사용자만 읽고 쓸 수 있도록 설정해야 합니다.
- Firebase SDK와 QRCode.js는 CDN에서 불러옵니다. 이를 사용하려면 인터넷 연결이 필요합니다.

---

<a id="english"></a>

## English

A web app for submitting school entry requests, getting teacher approval, and recording entry and exit times with a QR pass.

### Features

- Students can submit entry requests and generate QR passes.
- Teachers can sign in and filter requests by date, grade, approval status, and usage status.
- Teachers can approve selected requests in bulk.
- The QR pass opens a guard page that displays the request status and records entry and exit times.
- Data is stored in Firebase Realtime Database.

### Built with

- HTML, CSS, and JavaScript (ES modules)
- Firebase JavaScript SDK 10.8.1 and Realtime Database
- QRCode.js 1.0.0

### Run locally

This is a static web app with no build step. Start an HTTP server in the project directory and open it in a browser. For example, with Python:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Use HTTP(S), not a `file://` URL, because the app uses ES modules and loads the Firebase SDK externally. QR passes currently point to `https://onlineschoolentry.netlify.app/guard.html`; update the QR URL in `student.html` if you deploy to a different domain.

### Firebase data structure

The app uses these Realtime Database paths:

```text
teacher/{teacherKey}
  name: string
  email: string
  password: string

class/{grade}-{class}/{studentId}/{YYYY-MM-DD}
  name: string
  reason: string
  teacher: string
  accept: boolean
  realEnter: boolean
  enterTime: string
  leaveTime: string
```

Student IDs must follow a format from which the app can derive the grade and class, and the ID must already exist under `class` before a request can be submitted. This schema describes the fields used by the code; configure the actual database and security rules to match your deployment.

### Project files

```text
index.html       Landing page
student.html     Student requests and QR generation
teacher.html     Teacher sign-in and request management
guard.html       QR pass verification and entry logging
style.css        Shared styles
script/app.js    Firebase integration and page behavior
script/site.webmanifest  Web app manifest
```

### Deployment and configuration notes

- Firebase project settings are in `script/app.js`. Replace them and review the Realtime Database rules when using your own Firebase project.
- Teacher credentials are currently checked against email and password values in Realtime Database. For a public deployment, move authentication to Firebase Authentication and enforce appropriate database security rules.
- Database access depends on your Firebase security rules and allowed deployment domains. Restrict reads and writes to the users who need them.
- An internet connection is required to load Firebase SDK and QRCode.js from their CDNs.
