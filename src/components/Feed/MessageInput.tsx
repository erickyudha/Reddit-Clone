import { Box, Input, useColorModeValue } from "@chakra-ui/react";
import CryptoJS from "crypto-js";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";

import { firestore } from "../../firebase/clientApp";

interface MessageBody {
  communityId: string;
  senderId: string;
  senderImageUrl?: string;
  senderName: string;
  senderEmail: any;
  messageBody: string;
  sendedAt: Timestamp;
}

interface RedditUserDocument {
  userId?: string;
  userName: string;
  userEmail?: string;
  userImage: string;
  redditImage: string;
  timestamp: Timestamp;
}

type Props = {
  conversationId: string;
  user: User;
};

function MessageInput({ conversationId, user }: Props) {
  const [messageBody, setMessageBody] = useState("");
  const [redditUser, setRedditUser] = useState<RedditUserDocument>();
  const searchBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const searchBorder = useColorModeValue("gray.200", "#4A5568");

  const fetchRedditUser = async (userId: any) => {
    if (!userId) return;

    try {
      const docRef = doc(firestore, "redditUser", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRedditUser(docSnap.data() as RedditUserDocument);
      } else return;
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const onSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user && !messageBody) return;

    const encryptedData = [];

    const arrData = [
      conversationId as string,
      user.uid,
      user.email!.split("@")[0],
      user.email,
      messageBody,
      redditUser?.redditImage,
    ];

    for (let index = 0; index < 6; index++) {
      try {
        if (arrData[index]) {
          const data = CryptoJS.AES.encrypt(
            JSON.stringify(arrData[index]),
            process.env.NEXT_PUBLIC_CRYPTO_SECRET_PASS as string
          ).toString();

          encryptedData.push(data);
        }
      } catch (error: any) {
        console.log(error.message);
      }
    }

    try {
      const newMessageBody: MessageBody = {
        communityId: encryptedData[0],
        senderId: encryptedData[1],
        senderImageUrl: encryptedData[5]!,
        senderName: encryptedData[2],
        senderEmail: encryptedData[3],
        messageBody: encryptedData[4],
        sendedAt: serverTimestamp() as Timestamp,
      };

      await addDoc(
        collection(firestore, `communities/${conversationId}/conversation`),
        newMessageBody
      );

      setMessageBody("");
    } catch (error: any) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchRedditUser(user?.uid);
  }, [user]);

  return (
    <Box px={4} py={6} width="100">
      <form onSubmit={onSendMessage}>
        <Input
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          size="md"
          placeholder="Message Chat Feedback"
          resize="none"
          _focus={{
            boxShadow: "none",
            border: "1px solid",
            borderColor: searchBorder,
          }}
          bg={searchBg}
          disabled={!user}
        />
      </form>
    </Box>
  );
}

export default MessageInput;
