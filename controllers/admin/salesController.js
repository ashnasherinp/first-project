 const mongoose = require('mongoose');
const moment = require('moment');
const  PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');



const loadDashboard = async (req, res) => {
    try {
        let totalUsers = await User.countDocuments();
        let totalProducts = await Product.countDocuments();
        let totalOrders = await Order.countDocuments();

        const Sales = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { 
                $group: {
                    _id: null,
                    totalSales: { 
                        $sum: { $cond: [{ $eq: ['$discount', 0] }, '$totalPrice', '$finalAmount'] }
                    }
                }
            }
        ]);

        const totalSales = Sales.length > 0 ? Sales[0].totalSales : 0;

        const discount = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { 
                $group: {
                    _id: null,
                    discount: { $sum: '$discount' }
                }
            }
        ]);

        const totalDiscount = discount.length > 0 ? discount[0].discount : 0;

        const orders = await Order.find({status:"Delivered"});

        res.render('salesReport', { totalOrders, totalUsers, totalProducts, totalSales, totalDiscount, orders });
    } catch (error) {
        console.log("The error is", error);
    }
};




const dashboard = async (req, res) => {
    try {
        const { quickFilter, startDate, endDate } = req.body;
        let matchCondition = { status: "Delivered" };
        // let matchCondition = {cancellationReason : "none"};
        // console.log("quickFilter : ",quickFilter);
        // console.log("startDate : ",startDate);
        // console.log("endDate : ",endDate);


         
        
        if (startDate && endDate) {
            // If both startDate and endDate are provided, apply the date range filter
            matchCondition.createdOn = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        } else if (quickFilter) {
            // If quickFilter is provided and startDate/endDate are not, apply quickFilter
            matchCondition.createdOn = {};
            const now = new Date();
            switch (quickFilter) {
                case 'today':
                    matchCondition.createdOn.$gte = moment(now).startOf('day').toDate();
                    matchCondition.createdOn.$lte = moment(now).endOf('day').toDate();
                    break;
                case 'week':
                    matchCondition.createdOn.$gte = moment(now).startOf('isoWeek').toDate();
                    matchCondition.createdOn.$lte = moment(now).endOf('isoWeek').toDate();
                    break;
                case 'month':
                    matchCondition.createdOn.$gte = moment(now).startOf('month').toDate();
                    matchCondition.createdOn.$lte = moment(now).endOf('month').toDate();
                    break;
                case 'year':
                    matchCondition.createdOn.$gte = moment(now).startOf('year').toDate();
                    matchCondition.createdOn.$lt = moment(now).endOf('year').toDate();
                    break;
                default:
                    break;
            }
        }

        let totalUsers = await User.countDocuments();
        let totalProducts = await Product.countDocuments();
        let totalOrders = await Order.countDocuments();

        const Sales = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { 
                $group: {
                    _id: null,
                    totalSales: { 
                        $sum: { $cond: [{ $eq: ['$discount', 0] }, '$totalPrice', '$finalAmount'] }
                    }
                }
            }
        ]);

        const totalSales = Sales.length > 0 ? Sales[0].totalSales : 0;

        const orders = await Order.find(matchCondition);

        res.json({ totalOrders, totalUsers, totalProducts, totalSales, orders });

    } catch (error) {
        console.log("The error is", error);
    }
};
const generatePdfReport = async (req, res) => {
    try {
        const { quickFilter, startDate, endDate } = req.query;

        let matchCondition = { status: "Delivered" };

        // Apply date range filters
        if (startDate && endDate) {
            matchCondition.createdOn = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        } else if (quickFilter) {
            const now = new Date();
            switch (quickFilter) {
                case 'today':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('day').toDate(),
                        $lte: moment(now).endOf('day').toDate()
                    };
                    break;
                case 'week':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('isoWeek').toDate(),
                        $lte: moment(now).endOf('isoWeek').toDate()
                    };
                    break;
                case 'month':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('month').toDate(),
                        $lte: moment(now).endOf('month').toDate()
                    };
                    break;
                case 'year':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('year').toDate(),
                        $lte: moment(now).endOf('year').toDate()
                    };
                    break;
                default:
                    break;
            }
        }

        // Fetch filtered orders
        const orders = await Order.find(matchCondition);

        //create document and Set response headers to indicate a PDF file download
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        // Pipe the PDF stream to the response
        doc.pipe(res);

         // Add a title to the PDF
        doc.fontSize(25).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // Loop through each order and add its details to the PDF
        orders.forEach(order => {
            doc.fontSize(12).text(`Order ID: ${order.orderId}`);
            doc.text(`Date: ${new Date(order.createdOn).toLocaleDateString('en-US')}`);
            doc.text(`Amount: ₹${order.totalPrice}`);
            doc.text(`Discount: ₹${order.discount}`);
            doc.text(`Final Amount: ₹${order.finalAmount || order.totalPrice}`);
            doc.text(`Status: ${order.status}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.log("The error is", error);
    }
};







const generateExcelReport = async (req, res) => {
    try {
        const { quickFilter, startDate, endDate } = req.query;

        let matchCondition = { status: "Delivered" };

        // Apply date range filters
        if (startDate && endDate) {
            matchCondition.createdOn = {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            };
        } else if (quickFilter) {
            const now = new Date();
            switch (quickFilter) {
                case 'today':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('day').toDate(),
                        $lte: moment(now).endOf('day').toDate()
                    };
                    break;
                case 'week':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('isoWeek').toDate(),
                        $lte: moment(now).endOf('isoWeek').toDate()
                    };
                    break;
                case 'month':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('month').toDate(),
                        $lte: moment(now).endOf('month').toDate()
                    };
                    break;
                case 'year':
                    matchCondition.createdOn = {
                        $gte: moment(now).startOf('year').toDate(),
                        $lte: moment(now).endOf('year').toDate()
                    };
                    break;
                default:
                    break;
            }
        }

        // Fetch filtered orders
        const orders = await Order.find(matchCondition);

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Set up columns
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 25 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Add rows for each order
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId,
                date: new Date(order.invoiceDate).toLocaleDateString('en-US'),
                amount: order.totalPrice,
                discount: order.discount,
                finalAmount: order.finalAmount || order.totalPrice,
                status: order.status,
            });
        });

        // Set headers to force download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel report:", error);
        res.status(500).send("Error generating report.");
    }
};

module.exports={
    loadDashboard ,
    dashboard,
    generatePdfReport,
    generateExcelReport
}