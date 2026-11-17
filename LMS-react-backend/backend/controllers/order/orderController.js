import Order from "../../models/orderModel.js";

export const getAllOrders = async(req, res) => {
    try {
        const getAllOrder = await Order.find().populate('user', 'fullname username email').populate('course', 'name description price');
        res.status(200).json(getAllOrder);
    } catch (error) {
        console.log('Error fetching all orders: ', error);
        res.status(500).json({ message: 'Error fetching all orders', error: error.message });
    }
}

export const getDashOrderStats = async(req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ status: 'paid' });
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
        const totalRevenue = await Order.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]);
        const revenue = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
        const totalOrderChange = await Order.aggregate([
            { $group: { _id: { $month: "$createdAt" }, monthlyOrders: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 2 }
        ]);
        const totalPaidOrdersChange = await Order.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: { $month: "$createdAt" }, monthlyPaidOrders: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 2 }
        ]);
        const totalPendingOrdersChange = await Order.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: { $month: "$createdAt" }, monthlyPendingOrders: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 2 }
        ]);
        const totalCancelledOrdersChange = await Order.aggregate([
            { $match: { status: 'cancelled' } },
            { $group: { _id: { $month: "$createdAt" }, monthlyCancelledOrders: { $sum: 1 } } },
            { $sort: { "_id": -1 } },
            { $limit: 2 }
        ]);
        const totalRevenueChange = await Order.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: { $month: "$createdAt" }, monthlyRevenue: { $sum: '$amount' } } },
            { $sort: { "_id": -1 } },
            { $limit: 2 }
        ]);
        const change = totalRevenueChange;

        const revenueChange = change.length === 2 ? ((change[0].monthlyRevenue - change[1].monthlyRevenue) / change[1].monthlyRevenue) * 100 : 0;
        const totalOrderChangeValue = totalOrderChange.length === 2 ? ((totalOrderChange[0].monthlyOrders - totalOrderChange[1].monthlyOrders) / totalOrderChange[1].monthlyOrders) * 100 : 0;
        const totalPaidOrdersChangeValue = totalPaidOrdersChange.length === 2 ? ((totalPaidOrdersChange[0].monthlyPaidOrders - totalPaidOrdersChange[1].monthlyPaidOrders) / totalPaidOrdersChange[1].monthlyPaidOrders) * 100 : 0;
        const totalPendingOrdersChangeValue = totalPendingOrdersChange.length === 2 ? ((totalPendingOrdersChange[0].monthlyPendingOrders - totalPendingOrdersChange[1].monthlyPendingOrders) / totalPendingOrdersChange[1].monthlyPendingOrders) * 100 : 0;
        const totalCancelledOrdersChangeValue = totalCancelledOrdersChange.length === 2 ? ((totalCancelledOrdersChange[0].monthlyCancelledOrders - totalCancelledOrdersChange[1].monthlyCancelledOrders) / totalCancelledOrdersChange[1].monthlyCancelledOrders) * 100 : 0;
        res.status(200).json({ totalOrders, completedOrders, pendingOrders, cancelledOrders, revenue, revenueChange, totalOrderChangeValue, totalPaidOrdersChangeValue, totalPendingOrdersChangeValue, totalCancelledOrdersChangeValue });
    } catch (error) {
        console.log('Error fetching order stats: ', error);
        res.status(500).json({ message: 'Error fetching order stats', error: error.message });
    }
}