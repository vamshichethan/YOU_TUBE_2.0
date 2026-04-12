import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const channelName = channel?.channelname;

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!channelName) return;

      try {
        const res = await axiosInstance.get("/user/subscription-status", {
          params: { channelName },
        });
        setIsSubscribed(Boolean(res.data.subscribed));
        setSubscriberCount(Number(res.data.subscriberCount || 0));
      } catch (error) {
        console.log(error);
      }
    };

    fetchSubscriptionStatus();
  }, [channelName, user?._id]);

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please sign in to subscribe");
      return;
    }

    try {
      const res = await axiosInstance.post("/user/toggle-subscription", {
        channelName,
      });
      setIsSubscribed(Boolean(res.data.subscribed));
      setSubscriberCount(Number(res.data.subscriberCount || 0));
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update subscription.");
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{channel?.channelname.toLowerCase().replace(/\s+/g, "")}</span>
              <span>{subscriberCount.toLocaleString()} subscribers</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-gray-100" : "bg-red-600 hover:bg-red-700"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
