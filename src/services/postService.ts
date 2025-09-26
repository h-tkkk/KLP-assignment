import { firestore, storage, collections, storagePaths } from '../config/firebase';
import { Post, CreatePostData, CreateCommentData, Comment, ApiResponse, ImageAsset } from '../types';
import { AuthService } from './authService';

export class PostService {
  // 이미지 업로드
  static async uploadImage(imageAsset: ImageAsset): Promise<string | null> {
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const imagePath = `${storagePaths.POST_IMAGES}/${fileName}`;
      
      const reference = storage().ref(imagePath);
      await reference.putFile(imageAsset.uri);
      
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  }
  
  // 게시물 작성
  static async createPost(
    postData: CreatePostData,
    imageAsset?: ImageAsset
  ): Promise<ApiResponse<string>> {
    try {
      let imageUrl: string | undefined;
      
      // 이미지가 있으면 업로드
      if (imageAsset) {
        imageUrl = await this.uploadImage(imageAsset) || undefined;
      }
      
      // 현재 사용자의 프로필 사진 정보 가져오기
      const currentUser = AuthService.getCurrentUser();
      
      const now = new Date();
      const post: Omit<Post, 'id'> = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        authorId: postData.authorId,
        authorName: postData.authorName,
        authorPhotoURL: currentUser?.photoURL,
        ...(imageUrl && { imageUrl }), // imageUrl이 있을 때만 포함
        createdAt: now,
        updatedAt: now,
        likes: [],
        comments: [],
      };
      
      const docRef = await firestore()
        .collection(collections.POSTS)
        .add(post);
      
      return {
        success: true,
        data: docRef.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '게시물 작성에 실패했습니다.',
      };
    }
  }
  
  // 모든 게시물 가져오기
  static async getPosts(): Promise<ApiResponse<Post[]>> {
    try {
      const querySnapshot = await firestore()
        .collection(collections.POSTS)
        .orderBy('createdAt', 'desc')
        .get();
      
      const posts: Post[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        comments: doc.data().comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
        })),
      } as Post));
      
      return {
        success: true,
        data: posts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '게시물을 불러오는데 실패했습니다.',
      };
    }
  }
  
  // 특정 게시물 가져오기
  static async getPost(postId: string): Promise<ApiResponse<Post>> {
    try {
      const doc = await firestore()
        .collection(collections.POSTS)
        .doc(postId)
        .get();
      
      if (!doc.exists) {
        return {
          success: false,
          error: '게시물을 찾을 수 없습니다.',
        };
      }
      
      const data = doc.data()!;
      const post: Post = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        comments: (data.comments || []).map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          likes: comment.likes || [],
          replies: (comment.replies || []).map((reply: any) => ({
            ...reply,
            createdAt: typeof reply.createdAt === 'string' 
              ? new Date(reply.createdAt) 
              : reply.createdAt.toDate(),
            likes: reply.likes || [],
          })),
          isEdited: comment.isEdited || false,
        })),
      } as Post;
      
      return {
        success: true,
        data: post,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '게시물을 불러오는데 실패했습니다.',
      };
    }
  }
  
  // 좋아요 토글
  static async toggleLike(postId: string, userId: string): Promise<ApiResponse> {
    try {
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const likes: string[] = postData.likes || [];
        
        if (likes.includes(userId)) {
          // 좋아요 취소
          const updatedLikes = likes.filter(id => id !== userId);
          transaction.update(postRef, { likes: updatedLikes });
        } else {
          // 좋아요 추가
          transaction.update(postRef, { likes: [...likes, userId] });
        }
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '좋아요 처리에 실패했습니다.',
      };
    }
  }
  
  // 댓글 추가
  static async addComment(
    postId: string,
    commentData: CreateCommentData
  ): Promise<ApiResponse> {
    try {
      // 현재 사용자의 프로필 사진 정보 가져오기
      const currentUser = AuthService.getCurrentUser();
      
      const comment: Comment = {
        id: Date.now().toString(),
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        authorPhotoURL: currentUser?.photoURL,
        content: commentData.content,
        createdAt: new Date(),
        likes: [],
        replies: [],
        isEdited: false,
      };
      
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const comments: Comment[] = postData.comments || [];
        
        transaction.update(postRef, {
          comments: [...comments, {
            ...comment,
            createdAt: comment.createdAt.toISOString(),
          }],
        });
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '댓글 작성에 실패했습니다.',
      };
    }
  }
  
  // 실시간 게시물 목록 리스너
  static subscribeToPostUpdates(callback: (posts: Post[]) => void) {
    return firestore()
      .collection(collections.POSTS)
      .orderBy('createdAt', 'desc')
      .onSnapshot((querySnapshot) => {
        const posts: Post[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
          comments: (doc.data().comments || []).map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            likes: comment.likes || [],
            replies: (comment.replies || []).map((reply: any) => ({
              ...reply,
              createdAt: typeof reply.createdAt === 'string' 
                ? new Date(reply.createdAt) 
                : reply.createdAt.toDate(),
              likes: reply.likes || [],
            })),
            isEdited: comment.isEdited || false,
          })),
        } as Post));
        
        callback(posts);
      });
  }

  // 댓글 좋아요 토글
  static async toggleCommentLike(
    postId: string, 
    commentId: string, 
    userId: string
  ): Promise<ApiResponse> {
    try {
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const comments: Comment[] = postData.comments || [];
        
        const updatedComments = comments.map(comment => {
          if (comment.id === commentId) {
            const likes = comment.likes || [];
            if (likes.includes(userId)) {
              // 좋아요 취소
              return { ...comment, likes: likes.filter(id => id !== userId) };
            } else {
              // 좋아요 추가
              return { ...comment, likes: [...likes, userId] };
            }
          }
          return comment;
        });
        
        transaction.update(postRef, { comments: updatedComments });
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '댓글 좋아요 처리에 실패했습니다.',
      };
    }
  }

  // 댓글 수정
  static async updateComment(
    postId: string,
    commentId: string,
    newContent: string
  ): Promise<ApiResponse> {
    try {
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const comments: Comment[] = postData.comments || [];
        
        const updatedComments = comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: newContent,
              updatedAt: new Date(),
              isEdited: true,
            };
          }
          return comment;
        });
        
        transaction.update(postRef, { comments: updatedComments });
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '댓글 수정에 실패했습니다.',
      };
    }
  }

  // 댓글 삭제
  static async deleteComment(
    postId: string,
    commentId: string
  ): Promise<ApiResponse> {
    try {
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const comments: Comment[] = postData.comments || [];
        
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        
        transaction.update(postRef, { comments: updatedComments });
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '댓글 삭제에 실패했습니다.',
      };
    }
  }

  // 대댓글 추가
  static async addReply(
    postId: string,
    commentId: string,
    replyData: CreateCommentData
  ): Promise<ApiResponse> {
    try {
      // 현재 사용자의 프로필 사진 정보 가져오기
      const currentUser = AuthService.getCurrentUser();
      
      const postRef = firestore().collection(collections.POSTS).doc(postId);
      
      const reply = {
        id: Date.now().toString(),
        authorId: replyData.authorId,
        authorName: replyData.authorName,
        authorPhotoURL: currentUser?.photoURL,
        content: replyData.content,
        createdAt: new Date(),
        likes: [],
        isEdited: false,
      };
      
      await firestore().runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('게시물을 찾을 수 없습니다.');
        }
        
        const postData = postDoc.data()!;
        const comments: Comment[] = postData.comments || [];
        
        const updatedComments = comments.map(comment => {
          if (comment.id === commentId) {
            const replies = comment.replies || [];
            return {
              ...comment,
              replies: [...replies, {
                ...reply,
                createdAt: reply.createdAt.toISOString(),
              }],
            };
          }
          return comment;
        });
        
        transaction.update(postRef, { comments: updatedComments });
      });
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '대댓글 작성에 실패했습니다.',
      };
    }
  }

  // 게시물 삭제
  static async deletePost(postId: string): Promise<ApiResponse> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      // 게시물 정보 확인
      const postDoc = await firestore()
        .collection(collections.POSTS)
        .doc(postId)
        .get();

      if (!postDoc.exists) {
        return {
          success: false,
          error: '게시물을 찾을 수 없습니다.',
        };
      }

      const postData = postDoc.data();
      
      // 작성자 확인
      if (postData?.authorId !== currentUser.uid) {
        return {
          success: false,
          error: '본인이 작성한 게시물만 삭제할 수 있습니다.',
        };
      }

      // 게시물에 첨부된 이미지가 있으면 Storage에서도 삭제
      if (postData?.imageUrl) {
        try {
          const imageRef = storage().refFromURL(postData.imageUrl);
          await imageRef.delete();
        } catch (error) {
          // 이미지 삭제 실패는 로그만 남기고 계속 진행
          console.warn('이미지 삭제 실패:', error);
        }
      }

      // Firestore에서 게시물 삭제
      await firestore()
        .collection(collections.POSTS)
        .doc(postId)
        .delete();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '게시물 삭제에 실패했습니다.',
      };
    }
  }

  // 내가 작성한 게시물 조회
  static async getMyPosts(userId: string): Promise<ApiResponse<Post[]>> {
    try {
      // 인덱스 없이 작동하도록 쿼리 단순화
      const snapshot = await firestore()
        .collection(collections.POSTS)
        .where('authorId', '==', userId)
        .get();

      const posts: Post[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          comments: (data.comments || []).map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
            updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
            replies: (comment.replies || []).map((reply: any) => ({
              ...reply,
              createdAt: reply.createdAt ? new Date(reply.createdAt) : new Date(),
              updatedAt: reply.updatedAt ? new Date(reply.updatedAt) : undefined,
            })),
          })),
        } as Post;
      });

      // 클라이언트에서 정렬 (createdAt 기준 내림차순)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: posts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '내가 작성한 게시물을 불러올 수 없습니다.',
      };
    }
  }

  // 내가 좋아요한 게시물 조회
  static async getLikedPosts(userId: string): Promise<ApiResponse<Post[]>> {
    try {
      // 인덱스 없이 작동하도록 쿼리 단순화
      const snapshot = await firestore()
        .collection(collections.POSTS)
        .where('likes', 'array-contains', userId)
        .get();

      const posts: Post[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          comments: (data.comments || []).map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
            updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
            replies: (comment.replies || []).map((reply: any) => ({
              ...reply,
              createdAt: reply.createdAt ? new Date(reply.createdAt) : new Date(),
              updatedAt: reply.updatedAt ? new Date(reply.updatedAt) : undefined,
            })),
          })),
        } as Post;
      });

      // 클라이언트에서 정렬 (createdAt 기준 내림차순)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: posts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '좋아요한 게시물을 불러올 수 없습니다.',
      };
    }
  }

  // 사용자 활동 통계 조회
  static async getUserStatistics(userId: string): Promise<ApiResponse<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalReplies: number;
  }>> {
    try {
      // 모든 게시물 조회
      const allPostsSnapshot = await firestore()
        .collection(collections.POSTS)
        .get();

      let totalPosts = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalReplies = 0;

      allPostsSnapshot.docs.forEach(doc => {
        const postData = doc.data();
        
        // 내가 작성한 게시물 수
        if (postData.authorId === userId) {
          totalPosts++;
        }

        // 내 게시물에 받은 좋아요 수
        if (postData.authorId === userId && postData.likes) {
          totalLikes += postData.likes.length;
        }

        // 내가 작성한 댓글 수 및 답글 수
        if (postData.comments) {
          postData.comments.forEach((comment: any) => {
            if (comment.authorId === userId) {
              totalComments++;
            }
            
            if (comment.replies) {
              comment.replies.forEach((reply: any) => {
                if (reply.authorId === userId) {
                  totalReplies++;
                }
              });
            }
          });
        }
      });

      return {
        success: true,
        data: {
          totalPosts,
          totalLikes,
          totalComments,
          totalReplies,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '통계 정보를 불러올 수 없습니다.',
      };
    }
  }
}
