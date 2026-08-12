import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Purchase from "../models/Purchase.js";

/* =========================================================
   ADMIN DASHBOARD STATS

   GET /api/admin/dashboard/stats
========================================================= */

export const getAdminDashboardStats =
  async (
    req,
    res
  ) => {
    try {
      const [
        totalCourses,
        publishedCourses,
        totalStudents,
        activeStudents,
        totalPurchases,
        paidPurchases,
        pendingPurchases,
        totalVideosResult,
        totalMaterialsResult,
        revenueResult,
        recentPurchases,
      ] = await Promise.all([
        Course.countDocuments({}),
        Course.countDocuments({
          isPublished: true,
        }),
        Student.countDocuments({
          role: "student",
        }),
        Student.countDocuments({
          role: "student",
          isActive: true,
        }),
        Purchase.countDocuments({}),
        Purchase.countDocuments({
          status: "paid",
          isActive: true,
        }),
        Purchase.countDocuments({
          status: "pending",
        }),
        Course.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $ifNull: [
                    "$totalVideos",
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Course.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $ifNull: [
                    "$totalNotes",
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Purchase.aggregate([
          {
            $match: {
              status: "paid",
              isActive: true,
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount",
              },
            },
          },
        ]),
        Purchase.find({
          status: "paid",
          isActive: true,
        })
          .populate({
            path: "student",
            select:
              "name mobile email",
          })
          .populate({
            path: "course",
            select:
              "title thumbnail",
          })
          .select(
            "amount currency purchasedAt createdAt student course"
          )
          .sort({
            purchasedAt: -1,
            createdAt: -1,
          })
          .limit(8)
          .lean(),
      ]);

      const totalVideos =
        Number(
          totalVideosResult?.[0]
            ?.total
        ) || 0;

      const totalMaterials =
        Number(
          totalMaterialsResult?.[0]
            ?.total
        ) || 0;

      const revenue =
        Number(
          revenueResult?.[0]
            ?.total
        ) || 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalCourses,
          publishedCourses,
          totalStudents,
          activeStudents,
          totalPurchases,
          paidPurchases,
          pendingPurchases,
          totalVideos,
          totalMaterials,
          revenue,
          currency: "INR",
        },
        recentPurchases,
      });
    } catch (error) {
      console.error(
        "Admin Dashboard Stats Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load admin dashboard statistics.",
      });
    }
  };
