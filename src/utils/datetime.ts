export function isDST(now: Date): boolean {
  // Январь и декабрь точно не DST (для северного полушария)
  if (now.getMonth() < 2 || now.getMonth() > 9) return false;
  
  // Апрель-октябрь точно DST (для северного полушария)
  if (now.getMonth() > 2 && now.getMonth() < 9) return true;
  
  // Получаем дату последнего воскресенья марта
  const marchDate = new Date(now.getFullYear(), 2, 31);
  while (marchDate.getDay() !== 0) {
      marchDate.setDate(marchDate.getDate() - 1);
  }
  
  // Получаем дату последнего воскресенья октября
  const octoberDate = new Date(now.getFullYear(), 9, 31);
  while (octoberDate.getDay() !== 0) {
      octoberDate.setDate(octoberDate.getDate() - 1);
  }
  
  // Для марта: если текущая дата после последнего воскресенья - DST
  // Для октября: если текущая дата до последнего воскресенья - DST
  if (now.getMonth() === 2) {
      return now.getDate() >= marchDate.getDate() && 
             now.getHours() >= (marchDate.getHours() + 2); // обычно переход в 2:00
  } else {
      return now.getDate() < octoberDate.getDate() || 
            (now.getDate() === octoberDate.getDate() && 
             now.getHours() < (octoberDate.getHours() + 2)); // обычно переход в 2:00
  }
}

export function createUTCDate(year: number, month: number, day: number, hours: number, minutes: number, utc: number = 0): Date {
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  if (utc)
    date.setHours(date.getHours() - utc); // to UTC+0
  return date;
}
