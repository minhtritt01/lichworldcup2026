export interface StadiumDetails {
  name: string;
  name_vi: string;
  city: string;
  city_vi: string;
  capacity: string;
  opened: number;
  fact: string;
  fact_vi: string;
  mapUrl: string;
}

export const STADIUMS_DATA: Record<string, StadiumDetails> = {
  "Estadio Azteca": {
    name: "Estadio Azteca",
    name_vi: "Sân vận động Azteca",
    city: "Mexico City",
    city_vi: "Thành phố Mexico",
    capacity: "87,523",
    opened: 1966,
    fact: "The first stadium to host two FIFA World Cup Finals (1970 and 1986). It is the iconic cathedral of Mexican football.",
    fact_vi: "Sân vận động đầu tiên tổ chức hai trận Chung kết World Cup (1970 và 1986). Đây là thánh đường huyền thoại của bóng đá Mexico.",
    mapUrl: "https://maps.google.com/?q=Estadio+Azteca"
  },
  "SoFi Stadium": {
    name: "SoFi Stadium",
    name_vi: "Sân vận động SoFi",
    city: "Inglewood (LA)",
    city_vi: "Inglewood (Los Angeles)",
    capacity: "70,240",
    opened: 2020,
    fact: "The most expensive stadium in the world, featuring an open-air design, a transparent canopy, and a double-sided ovoid video board.",
    fact_vi: "Sân vận động đắt đỏ nhất thế giới, thiết kế mở ngoài trời với mái che trong suốt và màn hình LED treo hai mặt hình bầu oval khổng lồ.",
    mapUrl: "https://maps.google.com/?q=SoFi+Stadium"
  },
  "MetLife Stadium": {
    name: "MetLife Stadium",
    name_vi: "Sân vận động MetLife",
    city: "East Rutherford (NY)",
    city_vi: "East Rutherford (New York)",
    capacity: "82,500",
    opened: 2010,
    fact: "Chosen to host the FIFA World Cup 2026 Final. It is shared by both the New York Giants and New York Jets NFL teams.",
    fact_vi: "Được lựa chọn để tổ chức trận Chung kết FIFA World Cup 2026. Đây là sân nhà chung của cả hai đội bóng bầu dục nổi tiếng NY Giants và NY Jets.",
    mapUrl: "https://maps.google.com/?q=MetLife+Stadium"
  },
  "BMO Field": {
    name: "BMO Field",
    name_vi: "Sân vận động BMO Field",
    city: "Toronto",
    city_vi: "Toronto",
    capacity: "30,000",
    opened: 2007,
    fact: "Canada's premier soccer venue, situated in Exhibition Place, Toronto, which will be expanded to host World Cup matches.",
    fact_vi: "Sân vận động chuyên dụng cho bóng đá hàng đầu của Canada tại Toronto, sẽ được mở rộng thêm sức chứa để phục vụ các trận đấu World Cup.",
    mapUrl: "https://maps.google.com/?q=BMO+Field+Toronto"
  },
  "BC Place": {
    name: "BC Place",
    name_vi: "Sân vận động BC Place",
    city: "Vancouver",
    city_vi: "Vancouver",
    capacity: "54,500",
    opened: 1983,
    fact: "Located on the edge of False Creek, it features a cable-supported retractable roof and hosted the 2015 Women's World Cup Final.",
    fact_vi: "Tọa lạc bên bờ vịnh False Creek, sở hữu hệ thống mái che thu vào đỡ bằng cáp độc đáo. Từng tổ chức trận Chung kết World Cup Nữ 2015.",
    mapUrl: "https://maps.google.com/?q=BC+Place+Vancouver"
  },
  "Hard Rock Stadium": {
    name: "Hard Rock Stadium",
    name_vi: "Sân vận động Hard Rock",
    city: "Miami",
    city_vi: "Miami",
    capacity: "64,767",
    opened: 1987,
    fact: "A multi-purpose facility which has hosted six Super Bowls, and acts as the official racetrack for the Miami Formula 1 Grand Prix.",
    fact_vi: "Một tổ hợp thể thao đa năng từng tổ chức 6 trận đấu bóng bầu dục Super Bowl, và là đường đua chính thức cho giải đua xe Công thức 1 Miami GP.",
    mapUrl: "https://maps.google.com/?q=Hard+Rock+Stadium"
  },
  "AT&T Stadium": {
    name: "AT&T Stadium",
    name_vi: "Sân vận động AT&T",
    city: "Arlington (Dallas)",
    city_vi: "Arlington (Dallas)",
    capacity: "80,000",
    opened: 2009,
    fact: "Famous for its gigantic high-definition video screen hanging over the center of the field and its retractable roof.",
    fact_vi: "Nổi tiếng với màn hình LED treo trung tâm khổng lồ dài hơn 50 mét và mái che trượt điều khiển tự động.",
    mapUrl: "https://maps.google.com/?q=AT%26T+Stadium"
  },
  "Arrowhead Stadium": {
    name: "Arrowhead Stadium",
    name_vi: "Sân vận động Arrowhead",
    city: "Kansas City",
    city_vi: "Kansas City",
    capacity: "76,416",
    opened: 1972,
    fact: "Guinness World Record holder for the loudest outdoor sports stadium, reaching a noise level of 142.2 decibels.",
    fact_vi: "Giữ Kỷ lục Guinness thế giới về sân vận động ngoài trời có tiếng ồn lớn nhất lịch sử, đạt đỉnh 142,2 decibel.",
    mapUrl: "https://maps.google.com/?q=Arrowhead+Stadium"
  },
  "Mercedes-Benz Stadium": {
    name: "Mercedes-Benz Stadium",
    name_vi: "Sân vận động Mercedes-Benz",
    city: "Atlanta",
    city_vi: "Atlanta",
    capacity: "71,000",
    opened: 2017,
    fact: "Features a futuristic retractable roof with eight triangular translucent panels that open like a camera shutter.",
    fact_vi: "Sở hữu mái che tương lai gồm 8 tấm kính tam giác xếp mở xoay tròn như ống kính máy ảnh.",
    mapUrl: "https://maps.google.com/?q=Mercedes-Benz+Stadium"
  },
  "NRG Stadium": {
    name: "NRG Stadium",
    name_vi: "Sân vận động NRG",
    city: "Houston",
    city_vi: "Houston",
    capacity: "72,220",
    opened: 2002,
    fact: "The first NFL stadium constructed with a retractable roof, capable of sealing in air conditioning in hot Texas summers.",
    fact_vi: "Sân vận động NFL đầu tiên có mái che di động khép kín hoàn toàn, cho phép duy trì điều hòa mát lạnh giữa mùa hè oi bức ở Texas.",
    mapUrl: "https://maps.google.com/?q=NRG+Stadium"
  },
  "Gillette Stadium": {
    name: "Gillette Stadium",
    name_vi: "Sân vận động Gillette",
    city: "Boston",
    city_vi: "Boston",
    capacity: "65,878",
    opened: 2002,
    fact: "Features a signature lighthouse and bridge design at the north entrance. Home to the legendary New England Patriots.",
    fact_vi: "Nổi tiếng với thiết kế ngọn hải đăng và cây cầu độc bản ở cổng phía bắc. Sân nhà của đội bóng huyền thoại New England Patriots.",
    mapUrl: "https://maps.google.com/?q=Gillette+Stadium"
  },
  "Lincoln Financial Field": {
    name: "Lincoln Financial Field",
    name_vi: "Sân vận động Lincoln Financial",
    city: "Philadelphia",
    city_vi: "Philadelphia",
    capacity: "69,796",
    opened: 2003,
    fact: "Designed to look like an eagle, it is one of the most environmentally friendly stadiums in the USA, powered by solar panels.",
    fact_vi: "Thiết kế cách điệu từ hình cánh chim đại bàng, là một trong những sân vận động xanh thân thiện môi trường nhất nước Mỹ bằng năng lượng mặt trời.",
    mapUrl: "https://maps.google.com/?q=Lincoln+Financial+Field"
  },
  "Lumen Field": {
    name: "Lumen Field",
    name_vi: "Sân vận động Lumen Field",
    city: "Seattle",
    city_vi: "Seattle",
    capacity: "69,000",
    opened: 2002,
    fact: "U-shaped stadium designed to direct sound back to the field, making it one of the loudest venues in North America.",
    fact_vi: "Thiết kế hình chữ U đặc biệt giúp dội ngược toàn bộ âm thanh xuống sân đấu, tạo áp lực âm thanh vô cùng cuồng nhiệt.",
    mapUrl: "https://maps.google.com/?q=Lumen+Field"
  },
  "Levi's Stadium": {
    name: "Levi's Stadium",
    name_vi: "Sân vận động Levi's",
    city: "Santa Clara (SF)",
    city_vi: "Santa Clara (San Francisco)",
    capacity: "68,500",
    opened: 2014,
    fact: "Highly technological stadium located in Silicon Valley, built with a heavy focus on sustainable green materials.",
    fact_vi: "Sân vận động công nghệ cao tọa lạc tại Thung lũng Silicon, được xây dựng theo tiêu chuẩn xanh bền vững.",
    mapUrl: "https://maps.google.com/?q=Levi's+Stadium"
  },
  "Estadio Akron": {
    name: "Estadio Akron",
    name_vi: "Sân vận động Akron",
    city: "Guadalajara",
    city_vi: "Guadalajara",
    capacity: "48,071",
    opened: 2010,
    fact: "Designed to look like a grass-covered volcano rising out of the landscape, topped by an oval floating white ring canopy.",
    fact_vi: "Thiết kế mô phỏng một ngọn núi lửa phủ cỏ xanh mọc lên từ lòng đất, bên trên là vành đai mái che lơ lửng màu trắng.",
    mapUrl: "https://maps.google.com/?q=Estadio+Akron"
  },
  "Estadio BBVA": {
    name: "Estadio BBVA",
    name_vi: "Sân vận động BBVA",
    city: "Monterrey",
    city_vi: "Monterrey",
    capacity: "53,500",
    opened: 2015,
    fact: "Known as 'El Gigante de Acero' (The Steel Giant), it features a metallic design with views of the famous Cerro de la Silla mountain.",
    fact_vi: "Được gọi là 'Gã khổng lồ thép' nhờ thiết kế kim loại bóng bẩy, hướng tầm nhìn tuyệt đẹp ra ngọn núi Cerro de la Silla nổi tiếng.",
    mapUrl: "https://maps.google.com/?q=Estadio+BBVA"
  }
};
