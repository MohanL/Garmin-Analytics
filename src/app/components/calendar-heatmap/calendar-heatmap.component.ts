import { Component, Input, OnInit } from '@angular/core';
import { IYearSummary } from 'src/app/interfaces/year-summary.interface';
import { DateUtils } from 'src/app/utils/date.utils';
import { IDaySummary } from 'src/app/interfaces/day-summary.interface';

@Component({
  selector: 'app-calendar-heatmap',
  templateUrl: './calendar-heatmap.component.html',
  styleUrls: ['./calendar-heatmap.component.scss']
})
export class CalendarHeatmapComponent {
  /** Months labels */
  readonly months = DateUtils.MonthsList;

  /** Calendars to display */
  @Input() calendars: IYearSummary[] = [];

  public openCalendarDay(date: IDaySummary) {
    window.open(this.garminCalendarUrl(date.dateTooltip), '_blank');
  }

  private garminCalendarUrl(date: string): string {
    const CALLENDAR_URL = 'https://connect.garmin.cn/modern/daily-summary/';
    return `${CALLENDAR_URL}${DateUtils.formatDateToYYYYMMDD(date)}`;
  }

}
