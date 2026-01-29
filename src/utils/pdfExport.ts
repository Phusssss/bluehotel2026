import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import type { OccupancyReportData, RevenueReportData, ReservationReportData } from '../services/reportService';

/**
 * PDF export utilities for reports
 */
export class PDFExportService {
  /**
   * Export occupancy report to PDF
   */
  static exportOccupancyToPDF(
    data: OccupancyReportData[],
    summary: {
      averageOccupancy: number;
      maxOccupancy: number;
      minOccupancy: number;
      totalDays: number;
    } | null,
    hotelName: string,
    dateRange: { startDate: string; endDate: string },
    translations: any
  ): void {
    if (data.length === 0) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.text(translations.occupancy.title, pageWidth / 2, 20, { align: 'center' });
    
    // Hotel name and date range
    doc.setFontSize(12);
    doc.text(`Hotel: ${hotelName}`, 20, 35);
    doc.text(`Period: ${dayjs(dateRange.startDate).format('MMM DD, YYYY')} - ${dayjs(dateRange.endDate).format('MMM DD, YYYY')}`, 20, 45);
    doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 20, 55);

    let yPosition = 70;

    // Summary section
    if (summary) {
      doc.setFontSize(14);
      doc.text(translations.occupancy.summary.title, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const summaryData = [
        [translations.occupancy.summary.averageOccupancy, `${summary.averageOccupancy}%`],
        [translations.occupancy.summary.maxOccupancy, `${summary.maxOccupancy}%`],
        [translations.occupancy.summary.minOccupancy, `${summary.minOccupancy}%`],
        [translations.occupancy.summary.totalDays, summary.totalDays.toString()],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Detailed data table
    doc.setFontSize(14);
    doc.text('Detailed Report', 20, yPosition);
    yPosition += 10;

    const tableData = data.map(row => [
      dayjs(row.date).format('MMM DD, YYYY'),
      row.totalRooms.toString(),
      row.occupiedRooms.toString(),
      `${row.occupancyPercentage}%`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [[
        translations.occupancy.table.date,
        translations.occupancy.table.totalRooms,
        translations.occupancy.table.occupiedRooms,
        translations.occupancy.table.occupancyPercentage,
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 },
    });

    // Save the PDF
    const fileName = `occupancy-report-${dayjs().format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
  }

  /**
   * Export revenue report to PDF
   */
  static exportRevenueToPDF(
    data: RevenueReportData,
    hotelName: string,
    dateRange: { startDate: string; endDate: string },
    translations: any
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.text(translations.revenue.title, pageWidth / 2, 20, { align: 'center' });
    
    // Hotel name and date range
    doc.setFontSize(12);
    doc.text(`Hotel: ${hotelName}`, 20, 35);
    doc.text(`Period: ${dayjs(dateRange.startDate).format('MMM DD, YYYY')} - ${dayjs(dateRange.endDate).format('MMM DD, YYYY')}`, 20, 45);
    doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 20, 55);

    let yPosition = 70;

    // Revenue summary
    doc.setFontSize(14);
    doc.text(translations.revenue.summary.title, 20, yPosition);
    yPosition += 10;

    const summaryData = [
      [translations.revenue.summary.totalRevenue, `$${data.totalRevenue.toLocaleString()}`],
      [translations.revenue.summary.roomRevenue, `$${data.roomRevenue.toLocaleString()}`],
      [translations.revenue.summary.serviceRevenue, `$${data.serviceRevenue.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Revenue Type', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Revenue by Room Type
    if (data.revenueByRoomType.length > 0) {
      doc.setFontSize(14);
      doc.text(translations.revenue.roomTypes.title, 20, yPosition);
      yPosition += 10;

      const roomTypeData = data.revenueByRoomType.map(row => [
        row.roomTypeName,
        `$${row.revenue.toLocaleString()}`,
        row.reservationCount.toString(),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[
          translations.revenue.roomTypes.table.roomType,
          translations.revenue.roomTypes.table.revenue,
          translations.revenue.roomTypes.table.reservations,
        ]],
        body: roomTypeData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Revenue by Service
    if (data.revenueByService.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(translations.revenue.services.title, 20, yPosition);
      yPosition += 10;

      const serviceData = data.revenueByService.map(row => [
        row.serviceName,
        `$${row.revenue.toLocaleString()}`,
        row.orderCount.toString(),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[
          translations.revenue.services.table.service,
          translations.revenue.services.table.revenue,
          translations.revenue.services.table.orders,
        ]],
        body: serviceData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });
    }

    // Save the PDF
    const fileName = `revenue-report-${dayjs().format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
  }

  /**
   * Export reservation report to PDF
   */
  static exportReservationToPDF(
    data: ReservationReportData,
    hotelName: string,
    dateRange: { startDate: string; endDate: string },
    translations: any
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.text(translations.reservation.title, pageWidth / 2, 20, { align: 'center' });
    
    // Hotel name and date range
    doc.setFontSize(12);
    doc.text(`Hotel: ${hotelName}`, 20, 35);
    doc.text(`Period: ${dayjs(dateRange.startDate).format('MMM DD, YYYY')} - ${dayjs(dateRange.endDate).format('MMM DD, YYYY')}`, 20, 45);
    doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 20, 55);

    let yPosition = 70;

    // Summary section
    doc.setFontSize(14);
    doc.text(translations.reservation.summary.title, 20, yPosition);
    yPosition += 10;

    const summaryData = [
      [translations.reservation.summary.totalBookings, data.summary.totalBookings.toString()],
      [translations.reservation.summary.totalCancellations, data.summary.totalCancellations.toString()],
      [translations.reservation.summary.totalNoShows, data.summary.totalNoShows.toString()],
      [translations.reservation.summary.cancellationRate, `${data.summary.cancellationRate}%`],
      [translations.reservation.summary.noShowRate, `${data.summary.noShowRate}%`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Bookings by Source
    if (data.bookingsBySource.length > 0) {
      doc.setFontSize(14);
      doc.text(translations.reservation.bookingsBySource.title, 20, yPosition);
      yPosition += 10;

      const sourceData = data.bookingsBySource.map(row => [
        row.source,
        row.count.toString(),
        `${row.percentage}%`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[
          translations.reservation.bookingsBySource.table.source,
          translations.reservation.bookingsBySource.table.count,
          translations.reservation.bookingsBySource.table.percentage,
        ]],
        body: sourceData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Cancellations and No-Shows
    if (data.cancellationsAndNoShows.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(translations.reservation.cancellationsAndNoShows.title, 20, yPosition);
      yPosition += 10;

      const cancellationData = data.cancellationsAndNoShows.map(row => [
        dayjs(row.date).format('MMM DD, YYYY'),
        row.cancelled.toString(),
        row.noShows.toString(),
        row.total.toString(),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[
          translations.reservation.cancellationsAndNoShows.table.date,
          translations.reservation.cancellationsAndNoShows.table.cancelled,
          translations.reservation.cancellationsAndNoShows.table.noShows,
          translations.reservation.cancellationsAndNoShows.table.total,
        ]],
        body: cancellationData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 20, right: 20 },
      });
    }

    // Save the PDF
    const fileName = `reservation-report-${dayjs().format('YYYY-MM-DD')}.pdf`;
    doc.save(fileName);
  }
}