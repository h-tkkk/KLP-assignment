import { auth, firestore, storage, collections, storagePaths } from '../config/firebase';
import { User, AuthCredentials, SignUpData, ApiResponse, ImageAsset } from '../types';

export class AuthService {
  // 회원가입
  static async signUp(signUpData: SignUpData): Promise<ApiResponse<User>> {
    try {
      const { email, password, displayName } = signUpData;
      
      // Firebase Auth로 사용자 생성
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // 프로필 업데이트
      await firebaseUser.updateProfile({
        displayName: displayName,
      });
      
      // Firestore에 사용자 정보 저장
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
      };
      
      await firestore()
        .collection(collections.USERS)
        .doc(firebaseUser.uid)
        .set(userData);
      
      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      console.log('SignUp Error:', error.code, error.message);
      
      let errorMessage = '회원가입에 실패했습니다.';
      
      // Firebase Auth 오류 코드에 따른 한국어 메시지
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 형식입니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '이메일/비밀번호 회원가입이 비활성화되어 있습니다.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        default:
          errorMessage = error.message || '회원가입에 실패했습니다.';
          break;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  // 로그인
  static async signIn(credentials: AuthCredentials): Promise<ApiResponse<User>> {
    try {
      const { email, password } = credentials;
      
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Firestore에서 사용자 정보 가져오기
      const userDoc = await firestore()
        .collection(collections.USERS)
        .doc(firebaseUser.uid)
        .get();
      
      let userData: User;
      
      if (userDoc.exists) {
        userData = userDoc.data() as User;
      } else {
        // Firestore에 사용자 정보가 없으면 생성
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
        };
        
        await firestore()
          .collection(collections.USERS)
          .doc(firebaseUser.uid)
          .set(userData);
      }
      
      return {
        success: true,
        data: userData,
      };
    } catch (error: any) {
      console.log('SignIn Error:', error.code, error.message);
      
      let errorMessage = '로그인에 실패했습니다.';
      
      // Firebase Auth 오류 코드에 따른 한국어 메시지
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '유효하지 않은 이메일 형식입니다.';
          break;
        case 'auth/user-disabled':
          errorMessage = '비활성화된 계정입니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        default:
          errorMessage = error.message || '로그인에 실패했습니다.';
          break;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  // 로그아웃
  static async signOut(): Promise<ApiResponse> {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '로그아웃에 실패했습니다.',
      };
    }
  }
  
  // 현재 사용자 가져오기
  static getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    
    if (!firebaseUser) {
      return null;
    }
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      createdAt: new Date(), // 실제로는 Firestore에서 가져와야 함
    };
  }
  
  // 인증 상태 변화 리스너
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // 프로필 이미지 업로드 및 업데이트
  static async updateProfileImage(imageAsset: ImageAsset): Promise<ApiResponse<string>> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      // 이미지를 Firebase Storage에 업로드
      const fileName = `profile_${currentUser.uid}_${Date.now()}.jpg`;
      const storageRef = storage().ref(`${storagePaths.PROFILE_IMAGES}/${fileName}`);
      
      await storageRef.putFile(imageAsset.uri);
      const downloadURL = await storageRef.getDownloadURL();

      // Firebase Auth 프로필 업데이트
      await currentUser.updateProfile({
        photoURL: downloadURL,
      });

      // Firestore 사용자 문서 업데이트
      await firestore()
        .collection(collections.USERS)
        .doc(currentUser.uid)
        .update({
          photoURL: downloadURL,
        });

      // 기존 게시물의 작성자 프로필 사진도 업데이트
      await this.updatePostsAuthorPhoto(currentUser.uid, downloadURL);

      return {
        success: true,
        data: downloadURL,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '프로필 이미지 업데이트에 실패했습니다.',
      };
    }
  }

  // 프로필 정보 업데이트
  static async updateProfile(updates: Partial<Pick<User, 'displayName'>>): Promise<ApiResponse<User>> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      // Firebase Auth 프로필 업데이트
      if (updates.displayName !== undefined) {
        await currentUser.updateProfile({
          displayName: updates.displayName,
        });
      }

      // Firestore 사용자 문서 업데이트
      await firestore()
        .collection(collections.USERS)
        .doc(currentUser.uid)
        .update(updates);

      // 이름이 변경된 경우, 기존 게시물의 작성자 이름도 업데이트
      if (updates.displayName !== undefined) {
        await this.updatePostsAuthorName(currentUser.uid, updates.displayName);
      }

      // 업데이트된 사용자 정보 반환
      const updatedUser: User = {
        uid: currentUser.uid,
        email: currentUser.email!,
        displayName: currentUser.displayName || updates.displayName,
        photoURL: currentUser.photoURL,
        createdAt: new Date(), // 실제로는 Firestore에서 가져와야 함
      };

      return {
        success: true,
        data: updatedUser,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '프로필 업데이트에 실패했습니다.',
      };
    }
  }

  // 비밀번호 변경
  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      // 현재 비밀번호로 재인증
      const credential = auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
      await currentUser.reauthenticateWithCredential(credential);

      // 새 비밀번호로 업데이트
      await currentUser.updatePassword(newPassword);

      return {
        success: true,
      };
    } catch (error: any) {
      console.log('Password Change Error:', error.code, error.message);
      
      let errorMessage = '비밀번호 변경에 실패했습니다.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = '현재 비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '새 비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = '보안을 위해 다시 로그인 후 시도해주세요.';
          break;
        default:
          errorMessage = error.message || '비밀번호 변경에 실패했습니다.';
          break;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // 계정 삭제
  static async deleteAccount(password: string): Promise<ApiResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        return {
          success: false,
          error: '로그인이 필요합니다.',
        };
      }

      // 비밀번호로 재인증
      const credential = auth.EmailAuthProvider.credential(currentUser.email, password);
      await currentUser.reauthenticateWithCredential(credential);

      // Firestore에서 사용자 데이터 삭제
      await firestore()
        .collection(collections.USERS)
        .doc(currentUser.uid)
        .delete();

      // Firebase Auth에서 계정 삭제
      await currentUser.delete();

      return {
        success: true,
      };
    } catch (error: any) {
      console.log('Account Deletion Error:', error.code, error.message);
      
      let errorMessage = '계정 삭제에 실패했습니다.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = '보안을 위해 다시 로그인 후 시도해주세요.';
          break;
        default:
          errorMessage = error.message || '계정 삭제에 실패했습니다.';
          break;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // 기존 게시물의 작성자 이름 업데이트
  private static async updatePostsAuthorName(userId: string, newDisplayName: string): Promise<void> {
    try {
      // 모든 게시물 조회 (댓글과 답글 업데이트를 위해)
      const allPostsSnapshot = await firestore()
        .collection(collections.POSTS)
        .get();

      // 배치 작업 준비
      const batch = firestore().batch();
      let updateCount = 0;

      allPostsSnapshot.docs.forEach(doc => {
        const postRef = firestore().collection(collections.POSTS).doc(doc.id);
        const postData = doc.data();
        let needsUpdate = false;
        
        // 게시물의 작성자 이름 업데이트 (내가 작성한 게시물인 경우)
        if (postData.authorId === userId) {
          batch.update(postRef, { authorName: newDisplayName });
          needsUpdate = true;
        }
        
        // 댓글과 답글의 작성자 이름 업데이트 (모든 게시물에서)
        if (postData.comments && postData.comments.length > 0) {
          const updatedComments = postData.comments.map((comment: any) => {
            let commentUpdated = false;
            
            // 댓글 작성자가 현재 사용자인 경우
            if (comment.authorId === userId) {
              comment.authorName = newDisplayName;
              commentUpdated = true;
            }
            
            // 답글 작성자가 현재 사용자인 경우
            if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = comment.replies.map((reply: any) => {
                if (reply.authorId === userId) {
                  reply.authorName = newDisplayName;
                  commentUpdated = true;
                }
                return reply;
              });
              comment.replies = updatedReplies;
            }
            
            if (commentUpdated) {
              needsUpdate = true;
            }
            
            return comment;
          });
          
          if (needsUpdate) {
            batch.update(postRef, { comments: updatedComments });
          }
        }
        
        if (needsUpdate) {
          updateCount++;
        }
      });

      // 배치 실행
      if (updateCount > 0) {
        await batch.commit();
        console.log(`게시물 작성자 이름 업데이트 완료: ${updateCount}개 문서`);
      } else {
        console.log('업데이트할 게시물이 없습니다.');
      }
    } catch (error) {
      console.error('게시물 작성자 이름 업데이트 실패:', error);
    }
  }

  // 기존 게시물의 작성자 프로필 사진 업데이트
  private static async updatePostsAuthorPhoto(userId: string, newPhotoURL: string): Promise<void> {
    try {
      // 모든 게시물 조회 (댓글과 답글 프로필 사진 업데이트를 위해)
      const allPostsSnapshot = await firestore()
        .collection(collections.POSTS)
        .get();

      // 배치 작업 준비
      const batch = firestore().batch();
      let updateCount = 0;

      allPostsSnapshot.docs.forEach(doc => {
        const postRef = firestore().collection(collections.POSTS).doc(doc.id);
        const postData = doc.data();
        let needsUpdate = false;
        
        // 게시물의 작성자 프로필 사진 업데이트 (내가 작성한 게시물인 경우)
        if (postData.authorId === userId) {
          batch.update(postRef, { authorPhotoURL: newPhotoURL });
          needsUpdate = true;
        }
        
        // 댓글과 답글의 작성자 프로필 사진 업데이트 (모든 게시물에서)
        if (postData.comments && postData.comments.length > 0) {
          const updatedComments = postData.comments.map((comment: any) => {
            let commentUpdated = false;
            
            // 댓글 작성자가 현재 사용자인 경우
            if (comment.authorId === userId) {
              comment.authorPhotoURL = newPhotoURL;
              commentUpdated = true;
            }
            
            // 답글 작성자가 현재 사용자인 경우
            if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = comment.replies.map((reply: any) => {
                if (reply.authorId === userId) {
                  reply.authorPhotoURL = newPhotoURL;
                  commentUpdated = true;
                }
                return reply;
              });
              comment.replies = updatedReplies;
            }
            
            if (commentUpdated) {
              needsUpdate = true;
            }
            
            return comment;
          });
          
          if (needsUpdate) {
            batch.update(postRef, { comments: updatedComments });
          }
        }
        
        if (needsUpdate) {
          updateCount++;
        }
      });

      // 배치 실행
      if (updateCount > 0) {
        await batch.commit();
        console.log(`게시물 작성자 프로필 사진 업데이트 완료: ${updateCount}개 문서`);
      } else {
        console.log('업데이트할 게시물이 없습니다.');
      }
    } catch (error) {
      console.error('게시물 작성자 프로필 사진 업데이트 실패:', error);
    }
  }
}
