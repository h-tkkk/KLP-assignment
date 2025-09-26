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

## 📝 추가 개발 사항

향후 확장 가능한 기능들:
- 푸시 알림 (FCM)
- 소셜 로그인 (Google, Apple)
- 실시간 채팅
- 게시물 검색 및 필터링
- 사용자 팔로우 시스템

## 📄 라이선스

MIT License