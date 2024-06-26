import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "Title and Description must be provided");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail files must be provided");
  }
  const cloudinaryVideo = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!cloudinaryVideo || !thumbnail) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video or thumbnail"
    );
  }

  const owner = req.user._id;

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: cloudinaryVideo.url,
    duration: cloudinaryVideo.duration,
    owner,
  });

  const createdVideo = await Video.findById(video._id);

  if (!createdVideo) {
    throw new ApiError(500, "something went wrong while creating video in db");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { data: createdVideo }, "Video created successfully")
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const queryObject = {};
  if (query) {
    queryObject.title = { $regex: query, $options: "i" };
  }
  if (userId) {
    queryObject.owner = userId;
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortType || "asc";
  }

  const skip = (page - 1) * limit;

  const videos = await Video.find(queryObject)
    .sort(sort)
    .skip(skip)
    .limit(limit);
  const count = await Video.countDocuments(queryObject);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: { page, limit, totalPages: Math.ceil(count / limit) },
    })
  );
});

export { publishAVideo, getAllVideos };
