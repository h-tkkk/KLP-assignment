// 사용자 타입
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

// 게시물 타입
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  likes: string[]; // 좋아요한 사용자 ID 배열
  comments: Comment[];
}

// 댓글 타입
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: string[]; // 좋아요한 사용자 ID 배열
  replies: Reply[]; // 대댓글 배열
  isEdited?: boolean; // 수정된 댓글인지 여부
}

// 대댓글 타입
export interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: string[]; // 좋아요한 사용자 ID 배열
  isEdited?: boolean; // 수정된 대댓글인지 여부
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 인증 관련 타입
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  displayName: string;
  confirmPassword: string;
}

// 게시물 작성 데이터
export interface CreatePostData {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
}

// 댓글 작성 데이터
export interface CreateCommentData {
  authorId: string;
  authorName: string;
  content: string;
}

// 네비게이션 타입
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  MyPosts: undefined;
  LikedPosts: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  CreatePost: undefined;
  Profile: undefined;
};

// 이미지 업로드 타입
export interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
}
