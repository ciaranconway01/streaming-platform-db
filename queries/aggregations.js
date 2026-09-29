// 1. "Remake Search" Aggregation
// Distinguishes between original films and remakes using the $year date operator.
const remakeSearch = [
    { $match: { title: "The Lion King" } },
    { $project: { _id: 1, title: 1, releaseYear: { $year: "$releaseDate" }, ageRating: 1 } },
    { $sort: { releaseYear: 1 } }
];

// 2. "Crossover Cast" Aggregation
// Identifies actors who appear in at least one film and one series episode watched by a user.
const crossoverCast = [
    { $match: { userId: "user_john_01" } },
    { $lookup: { from: "Films", localField: "contentId", foreignField: "_id", as: "filmData" } },
    { $lookup: { from: "Series", localField: "contentId", foreignField: "seasons.episodes._id", as: "seriesData" } },
    { $project: {
        contentType: 1,
        title: { $cond: { if: { $eq: ["$contentType", "film"] }, then: { $arrayElemAt: ["$filmData.title", 0] }, else: { $arrayElemAt: ["$seriesData.title", 0] } } },
        cast: { $cond: { if: { $eq: ["$contentType", "film"] }, then: { $arrayElemAt: ["$filmData.cast", 0] }, else: { $arrayElemAt: ["$seriesData.cast", 0] } } }
    }},
    { $unwind: "$cast" },
    { $group: { _id: "$cast", showsWatched: { $addToSet: "$title" }, mediaTypes: { $addToSet: "$contentType" } } },
    { $match: { mediaTypes: { $all: ["film", "episode"] } } },
    { $lookup: { from: "Actors", localField: "_id", foreignField: "_id", as: "actorDetails" } },
    { $project: { _id: 0, actorName: { $arrayElemAt: ["$actorDetails.name", 0] }, sharedContent: "$showsWatched" } }
];

// 3. Membership Fee Comparison
// Pivots embedded membership prices into a single document for comparison.
const feeComparison = [
    { $match: { _id: { $in: ["user_john_01", "user_sarah_01"] } } },
    { $group: {
        _id: null,
        johnFee: { $max: { $cond: [{ $eq: ["$_id", "user_john_01"] }, "$membership.price", 0] } },
        sarahFee: { $max: { $cond: [{ $eq: ["$_id", "user_sarah_01"] }, "$membership.price", 0] } }
    }},
    { $project: {
        _id: 0,
        johnPremiumFee: "$johnFee",
        sarahStandardFee: "$sarahFee",
        priceDifference: { $round: [{ $subtract: ["$johnFee", "$sarahFee"] }, 2] }
    }}
];

// 4. Profile Engagement Analytics
// Calculates average watch session length and completion percentage.
const profileEngagement = [
    { $match: { userId: "user_john_01" } },
    { $group: {
        _id: "$profileName",
        averageWatchTime: { $avg: "$timeWatched" },
        averageCompletionPercentage: { $avg: { $multiply: [ { $divide: ["$timeWatched", "$duration"] }, 100 ] } },
        totalSessions: { $sum: 1 }
    }},
    { $project: {
        _id: 0,
        profileName: "$_id",
        averageMinutes: { $round: ["$averageWatchTime", 1] },
        averageCompletionPercent: { $round: ["$averageCompletionPercentage", 1] },
        totalSessions: 1
    }},
    { $sort: { averageCompletionPercent: -1 } }
];

// 5. Genre Popularity Heatmap
// Flattens genre arrays to count occurrences across the entire platform.
const genreHeatmapLogic = [
    { $lookup: { from: "Films", localField: "contentId", foreignField: "_id", as: "filmData" } },
    { $lookup: { from: "Series", localField: "contentId", foreignField: "seasons.episodes._id", as: "seriesData" } },
    { $project: {
        allGenres: {
            $concatArrays: [
                { $ifNull: [{ $arrayElemAt: ["$filmData.genres", 0] }, []] },
                { $ifNull: [{ $arrayElemAt: ["$seriesData.genres", 0] }, []] }
            ]
        }
    }},
    { $unwind: "$allGenres" },
    { $group: { _id: "$allGenres", totalViews: { $sum: 1 } } },
    { $sort: { totalViews: -1 } }
];

// 6. Cross-Collection Trending Monitor
// Queries Films and Series simultaneously using $unionWith to find trending titles.
const combinedTrendingLogic = [
    { $unionWith: { coll: "Series" } },
    { $match: { $or: [ { viewsToday: { $gt: 5000 } }, { viewsTotal: { $gt: 10000000 } } ] } },
    { $project: { _id: 0, title: 1, contentType: 1, viewsToday: 1, viewsTotal: 1 } },
    { $sort: { viewsToday: -1 } }
];

// 7. Content Duration Categorization
// Groups films into predefined length boundaries using the $bucket stage.
const durationCategories = [
    { $addFields: { numericLength: { $toInt: { $arrayElemAt: [{ $split: ["$length", " "] }, 0] } } } },
    { $bucket: {
        groupBy: "$numericLength",
        boundaries: [0, 90, 120, 300],
        default: "Unknown",
        output: { totalFilms: { $sum: 1 }, allMovieTitles: { $push: "$title" } }
    }},
    { $project: { totalFilms: 1, previewTitles: { $slice: ["$allMovieTitles", 3] } } }
];