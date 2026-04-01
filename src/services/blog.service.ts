import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { BlogPost } from "@/types/blog";

export const listPublishedPosts = async () => {
  const ref = query(
    collection(firebaseDb, "blogPosts"),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
  );
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as BlogPost[];
};

export const getPostBySlug = async (slug: string) => {
  const ref = query(collection(firebaseDb, "blogPosts"), where("slug", "==", slug));
  const snapshot = await getDocs(ref);
  const first = snapshot.docs[0];
  if (!first) return null;
  return { id: first.id, ...first.data() } as BlogPost;
};

export const createBlogPost = async (payload: Omit<BlogPost, "id">) => {
  return addDoc(collection(firebaseDb, "blogPosts"), payload);
};

export const registerPostLike = async (postId: string, sessionId: string) => {
  const likeId = `${postId}_${sessionId}`;
  const likeRef = doc(firebaseDb, "blogLikes", likeId);
  const existing = await getDoc(likeRef);
  if (existing.exists()) return { ok: false, reason: "already-liked" };

  await setDoc(likeRef, { postId, sessionId, createdAt: serverTimestamp() });
  await updateDoc(doc(firebaseDb, "blogPosts", postId), {
    likesCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
};
