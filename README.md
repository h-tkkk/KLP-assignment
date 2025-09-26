# 커뮤니티 앱 MVP

React Native + Firebase + TypeScript로 개발된 커뮤니티 앱입니다.

## 🚀 주요 기능

- **🔐 회원가입/로그인**: Firebase Authentication을 사용한 이메일 기반 인증
- **📝 게시물 작성**: 제목, 내용, 이미지 첨부 기능
- **📋 게시물 목록**: 최신순으로 정렬된 게시물 리스트
- **👀 게시물 상세**: 게시물 내용과 댓글 확인
- **💬 댓글 기능**: 게시물에 댓글 작성 및 실시간 업데이트
- **❤️ 좋아요**: 게시물에 좋아요 표시
- **📷 이미지 업로드**: 갤러리에서 선택하거나 카메라로 촬영
- **👤 프로필 관리**: 사용자 정보 확인 및 로그아웃

## 🛠 기술 스택

- **React Native 0.81.4**: 크로스플랫폼 모바일 앱 개발
- **TypeScript 5.8.3**: 정적 타입 검사
- **React Native Firebase**: 백엔드 서비스
  - Authentication: 사용자 인증
  - Firestore: NoSQL 데이터베이스
  - Storage: 이미지 파일 저장
- **React Navigation 7.x**: 앱 내 네비게이션
- **React Native Image Picker**: 이미지 선택 및 카메라 기능

## 📁 프로젝트 구조

```
src/
├── components/
│   └── Navigation.tsx       # 네비게이션 구조
├── screens/
│   ├── LoginScreen.tsx      # 로그인 화면
│   ├── SignUpScreen.tsx     # 회원가입 화면
│   ├── HomeScreen.tsx       # 게시물 목록 화면
│   ├── PostDetailScreen.tsx # 게시물 상세 화면
│   ├── CreatePostScreen.tsx # 게시물 작성 화면
│   └── ProfileScreen.tsx    # 프로필 화면
├── services/
│   ├── authService.ts       # 인증 관련 서비스
│   └── postService.ts       # 게시물 관련 서비스
├── config/
│   └── firebase.ts          # Firebase 설정
└── types/
    └── index.ts             # TypeScript 타입 정의
```

## 🔧 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

#### Firebase 프로젝트 생성
1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성
3. 다음 서비스들을 활성화:
   - **Authentication**: Sign-in method에서 이메일/비밀번호 활성화
   - **Firestore Database**: 테스트 모드로 시작
   - **Storage**: 기본 설정으로 생성

#### Android 설정
1. Firebase 프로젝트에 Android 앱 추가
2. 패키지 이름: `com.communityapp` (또는 실제 패키지명)
3. `google-services.json` 파일을 `android/app/` 디렉토리에 복사

#### iOS 설정 (macOS에서만 가능)
1. Firebase 프로젝트에 iOS 앱 추가
2. 번들 ID: `com.communityapp` (또는 실제 번들 ID)
3. `GoogleService-Info.plist` 파일을 Xcode 프로젝트에 추가

### 3. 네이티브 의존성 설치

#### Android
```bash
npx react-native run-android
```

#### iOS (macOS에서만 가능)
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

## 📱 주요 화면

### 인증 화면
- **로그인**: 이메일/비밀번호 로그인
- **회원가입**: 새 계정 생성 (이름, 이메일, 비밀번호)

### 메인 화면
- **홈**: 게시물 목록, 좋아요, 댓글 수 표시
- **글쓰기**: 제목, 내용, 이미지 첨부
- **프로필**: 사용자 정보, 로그아웃

### 상세 기능
- **게시물 상세**: 전체 내용, 댓글 목록
- **댓글 시스템**: 실시간 댓글 작성 및 표시
- **이미지 처리**: 갤러리/카메라 선택, 업로드

## 🔐 Firebase 보안 규칙

### Firestore 규칙 예시
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 문서만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시물은 인증된 사용자만 읽기 가능, 작성자만 수정 가능
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

### Storage 규칙 예시
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🛠 개발 가이드

### TypeScript 사용
모든 컴포넌트와 서비스는 TypeScript로 작성되어 있습니다:
- 강타입 체크로 런타임 오류 방지
- 인텔리센스 지원으로 개발 효율성 향상
- 인터페이스와 타입 정의로 코드 문서화

### 코드 스타일
- ESLint + Prettier 설정 적용
- 함수형 컴포넌트 + Hooks 사용
- 모듈별 서비스 클래스 분리

### 상태 관리
- React Hooks (useState, useEffect) 사용
- Firebase의 실시간 리스너 활용

## 🚨 주의사항

1. **Firebase 설정**: `google-services.json` (Android) 및 `GoogleService-Info.plist` (iOS) 파일이 필요합니다.

2. **권한 설정**: 
   - Android: `android/app/src/main/AndroidManifest.xml`에 카메라/저장소 권한 추가
   - iOS: `ios/CommunityApp/Info.plist`에 카메라/사진 라이브러리 권한 추가

3. **네트워크 보안**: 
   - Android 9+ (API 28+)에서 HTTP 요청 제한
   - 필요시 `android/app/src/main/AndroidManifest.xml`에 네트워크 보안 설정 추가

## 📝 추가 개발 사항

향후 확장 가능한 기능들:
- 푸시 알림 (FCM)
- 소셜 로그인 (Google, Apple)
- 실시간 채팅
- 게시물 검색 및 필터링
- 사용자 팔로우 시스템
- 다크 모드 지원

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request