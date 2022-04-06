const Post = require("../../models/Post");

const checkAuth = require("../../util/checkAuth");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        console.log(err);
      }
    },
    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);
        // console.log(postId);
        // console.log(post);

        if (post) return post;

        throw new Error("Post not found");
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = checkAuth(context);

      console.log(user);

      if (body.trim() === "") {
        throw new Error("Post body must not be empty");
      }

      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString(),
      });

      const post = await newPost.save();
      // context.pubsub.publish("NEW_POST", { newPost: post });

      return post;
    },

    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);
        if (!post) {
          throw new Error("Post not found");
        }

        if (user.username === post.username) {
          await post.delete();
          return "Post deleted successfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },

    async likePost(_, { postId }, context) {
      const { username } = checkAuth(context);
      const post = await Post.findById(postId);

      if (post) {
        if (post.likes.find((like) => like.username === username)) {
          // Post already liked
          // Unlike it
          post.likes = post.likes.filter((like) => like.username !== username);
        } else {
          // Not liked
          // like it
          post.likes.push({ username, createdAt: new Date().toISOString() });
        }

        await post.save();
        return post;
      }
      throw new UserInputError("Post not found");
    },
  },
};
