const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

//@route    POST api/posts
//@desc     Create a post
//@access   Private
router.post(
  '/',
  [auth, [check('text', 'Text is required')]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post = new Post(newPost);
      await post.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route    GET api/posts
//@desc     Get all posts
//@access   Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    GET api/posts/:post_id
//@desc     Get post by id
//@access   Private
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(400).send('Post not found');
    }
    res.json(post);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    DELETE api/post/:post_id
//@desc     Delete post
//@access   Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(401).json({ msg: 'Post not found' });
    }
    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@todo Realistically liked posts should be attached to the individual, not the other way around.

//@route    PUT api/posts/like/:post_id
//@desc     Add like
//@access   Private
router.put('/like/:post_id', [auth], async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const hasUserLiked =
      post.likes.filter((like) => like.user.toString() == req.user.id).length >
      0;
    if (hasUserLiked) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    //Add to beginning instead of end
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/unlike/:post_id
//@desc     Remove like
//@access   Private
router.put('/unlike/:post_id', [auth], async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const hasUserLiked =
      post.likes.filter((like) => like.user.toString() == req.user.id).length >
      0;
    if (!hasUserLiked) {
      return res.status(400).json({ msg: 'Post has not been liked' });
    }
    //Get the index of our requested id (in an array of itemIDs)
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    if (removeIndex == -1) {
      return res.status(400).json({ msg: 'Post has not been liked' });
    }
    //Remove the experience at that index
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route    POST api/posts/comment/:post_id
//@desc     Comment on a post
//@access   Private
router.post(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required')]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(401).json({ msg: 'Post not found' });
      }
      const user = await User.findById(req.user.id).select('-password');
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route    DELETE api/comment/:post_id/:comment_id
//@desc     Delete comment on a specific post
//@access   Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(401).json({ msg: 'Post not found' });
    }
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    if (!comment) {
      return res.status(401).json({ msg: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    //Get the index of our requested comment id (in an array of itemIDs)
    const removeIndex = post.comments
      .map((commentItem) => commentItem.id.toString())
      .indexOf(comment.id);
    if (removeIndex == -1) {
      return res.status(400).json({ msg: 'Comment not found' });
    }

    //Remove the experience at that index
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
