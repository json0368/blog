import { RSSOptions } from "vitepress-plugin-rss";
import { applyAllImageTransformers } from "../../../plugins/vitepress-plugin-rss/transformers/ely-image-transformer";
import { DOMAIN } from "../constants";

export const rssConfig: RSSOptions = {
  title: "我",
  baseUrl: DOMAIN,
  copyright: "Copyright (c) 2024-present, Mark Chen",
  description: "To trace the bright moonlight",
  language: "zh-cn",
  author: {
    name: "json0368",
    email: "email@blue-archive.io",
    link: "https://github.com/json0368",
  },
  icon: true,
  filename: "feed.rss",
  ignoreHome: true,
  transform: applyAllImageTransformers,
};
