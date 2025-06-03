import { Comment } from "../comments/comments.schema";
import { Blog } from "./blogs.schema";

export interface BlogWithComments extends Blog {
    comments: (Comment & { userId?: any })[];
}