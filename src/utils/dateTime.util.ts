export class DateTimeUtil {
  private tokenObj: { tokenType: string; accessToken: string; expires: Date };

  constructor() {
    this.tokenObj = null;
  }

  /**
   * Return date as MM.dd.yyyy HH:mi:ss" format
   */
  toLogiwaDateFormat(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = ('0' + (date.getMonth() + 1)).substr(-2);
    const dd = ('0' + date.getDate()).substr(-2);
    const hh = ('0' + date.getHours()).substr(-2);
    const mi = ('0' + date.getMinutes()).substr(-2);
    const ss = ('0' + date.getSeconds()).substr(-2);

    return `${mm}.${dd}.${yyyy} ${hh}:${mi}:${ss}`;
  }

  toDateStringFromLogiwaDateFormat(dateStr: string): string {
    const tokens = dateStr.split(/[.: ]/);
    return `${tokens[2]}${tokens[0]}${tokens[1]}${tokens[3]}${tokens[4]}${tokens[5]}`;
  }

  toDateFromDateString(yyyymmddHHmiss: string): Date {
    return new Date(
      Number(yyyymmddHHmiss.substring(0, 4)),
      Number(yyyymmddHHmiss.substring(4, 6)) - 1,
      Number(yyyymmddHHmiss.substring(6, 8)),
      Number(yyyymmddHHmiss.substring(8, 10)),
      Number(yyyymmddHHmiss.substring(10, 12)),
      Number(yyyymmddHHmiss.substring(12)),
    );
  }

  getDttmFromDate(date: Date): string {
    // current year
    const yyyy: number = date.getFullYear();

    // current month
    const mm: string = ('0' + (date.getMonth() + 1)).slice(-2);

    // current date
    const dd: string = ('0' + date.getDate()).slice(-2);

    // current hours
    const hh: string = ('0' + date.getHours()).slice(-2);

    // current minutes
    const mi: string = ('0' + date.getMinutes()).slice(-2);

    // current seconds
    const ss: string = ('0' + date.getSeconds()).slice(-2);

    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }

  getCurrentDate(): Date {
    return new Date(Date.now());
  }

  getYesterDate(): Date {
    return new Date(Date.now() - 1000 * 60 * 60 * 24);
  }

  getCurrentDttm(): string {
    return this.getDttmFromDate(this.getCurrentDate());
  }

  getTimeFormatFromDate(date: Date): string {
    // current hours
    const hh: string = ('0' + date.getHours()).slice(-2);

    // current minutes
    const mi: string = ('0' + date.getMinutes()).slice(-2);

    // current seconds
    const ss: string = ('0' + date.getSeconds()).slice(-2);

    return `${hh}:${mi}:${ss}`;
  }

  convertDateFromat(yyyymmdd: string): string {
    const yyyy = yyyymmdd.slice(0, 4);
    const mm = yyyymmdd.slice(4, 6);
    const dd = yyyymmdd.slice(6, 8);

    return `${yyyy}-${mm}-${dd}`;
  }

  convertTimeFormat(hhmiss: string): string {
    const hh = hhmiss.slice(0, 2);
    const mi = hhmiss.slice(2, 4);
    const ss = hhmiss.slice(4, 6);

    return `${hh}:${mi}:${ss}`;
  }

  convertDatetimeFormat(dttm: string): string {
    return `${this.convertDateFromat(dttm.slice(0, 8))} ${this.convertTimeFormat(dttm.slice(-6))}`;
  }

  subtractDate(srcDate: Date, days: number, hours: number, minutes: number, seconds: number): Date {
    const oneSecond = 1000;
    const oneMinute = oneSecond * 60;
    const oneHour = oneMinute * 60;
    const oneDay = oneHour * 24;

    return new Date(srcDate.getTime() - (oneDay * days + oneHour * hours + oneMinute * minutes + oneSecond * seconds));
  }

  addDate(srcDate: Date, days: number, hours: number, minutes: number, seconds: number): Date {
    const oneSecond = 1000;
    const oneMinute = oneSecond * 60;
    const oneHour = oneMinute * 60;
    const oneDay = oneHour * 24;

    return new Date(srcDate.getTime() + (oneDay * days + oneHour * hours + oneMinute * minutes + oneSecond * seconds));
  }
}

export const getCurrentDate = (): Date => new Date(Date.now());
export const getMidnight = (date: Date): Date => new Date(date.setHours(0, 0, 0, 0));
export const toDateFromISOString = (isoDate: string): Date => new Date(isoDate);

export const toDateFromDateString = (dateStr: string): Date =>
  dateStr.lastIndexOf('Z') > -1
    ? toDateFromISOString(dateStr)
    : new Date(
        Number(dateStr.substring(0, 4)),
        Number(dateStr.substring(4, 6)) - 1,
        Number(dateStr.substring(6, 8)),
        Number(dateStr.substring(8, 10)),
        Number(dateStr.substring(10, 12)),
        Number(dateStr.substring(12)),
      );

export const getDttmFromDate = (date: Date): string => {
  // current year
  const yyyy: number = date.getFullYear();

  // current month
  const mm: string = ('0' + (date.getMonth() + 1)).slice(-2);

  // current date
  const dd: string = ('0' + date.getDate()).slice(-2);

  // current hours
  const hh: string = ('0' + date.getHours()).slice(-2);

  // current minutes
  const mi: string = ('0' + date.getMinutes()).slice(-2);

  // current seconds
  const ss: string = ('0' + date.getSeconds()).slice(-2);

  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
};

export const getTimeFormatFromDate = (date: Date): string => {
  // current hours
  const hh: string = ('0' + date.getHours()).slice(-2);

  // current minutes
  const mi: string = ('0' + date.getMinutes()).slice(-2);

  // current seconds
  const ss: string = ('0' + date.getSeconds()).slice(-2);

  return `${hh}:${mi}:${ss}`;
};

export const getCurrentDttm = (): string => {
  return getDttmFromDate(getCurrentDate());
};

export const addDate = (srcDate: Date, days: number, hours: number, minutes: number, seconds: number): Date => {
  const oneSecond = 1000;
  const oneMinute = oneSecond * 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;

  return new Date(srcDate.getTime() + (oneDay * days + oneHour * hours + oneMinute * minutes + oneSecond * seconds));
};

export const subtractDate = (srcDate: Date, days: number, hours: number, minutes: number, seconds: number): Date => {
  const oneSecond = 1000;
  const oneMinute = oneSecond * 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;

  return new Date(srcDate.getTime() - (oneDay * days + oneHour * hours + oneMinute * minutes + oneSecond * seconds));
};

/**
 * Return date as MM.dd.yyyy HH:mi:ss" format
 */
export const toLogiwaDateFormat = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = ('0' + (date.getMonth() + 1)).substr(-2);
  const dd = ('0' + date.getDate()).substr(-2);
  const hh = ('0' + date.getHours()).substr(-2);
  const mi = ('0' + date.getMinutes()).substr(-2);
  const ss = ('0' + date.getSeconds()).substr(-2);

  return `${mm}.${dd}.${yyyy} ${hh}:${mi}:${ss}`;
};

export const toAmazonDateFormat = (date: Date): string => {
  const yyyy = date.getUTCFullYear();
  const mm = ('0' + (date.getUTCMonth() + 1)).substr(-2);
  const dd = ('0' + date.getUTCDate()).substr(-2);
  const hh = ('0' + date.getUTCHours()).substr(-2);
  const mi = ('0' + date.getUTCMinutes()).substr(-2);
  const ss = ('0' + date.getUTCSeconds()).substr(-2);

  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
};
