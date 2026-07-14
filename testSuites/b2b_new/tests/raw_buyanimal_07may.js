import { transaction, k6Check, request, createJourneyLifecycleStore, runJourneyLifecycle, thinktime, logReplayExchange, trackCorrelation, trackParameter, clearCookies, getEnvContext } from '../../../dist/index.js';

const env = getEnvContext('b2b_new', { baseUrl: 'https://jpetstore.aspectran.com' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  transaction('launch', function () {
    const res1 = request('GET', `${env.baseUrl}/`, {
      name: `GET_root_1`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_1`,
        recordingStartedAt: `2026-06-08T14:19:29.746Z`,
      },
    });
    k6Check(res1, {
      "launch - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_1`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_2`,
        recordingStartedAt: `2026-06-08T14:19:30.414Z`,
      },
    });
    k6Check(res2, {
      "launch - status is 200": (r) => r.status === 200,
    });

    const res3 = request('POST', `${env.baseUrl}/cdn-cgi/challenge-platform/h/g/jsd/oneshot/8fc8ed1d8752/0.3854021426848441:1780927220:gHTu-DvnpHESSglaNGd_a67XAUuwg-S9rQu6CzdjB_A/a08888273d295795`, {
      name: `POST_a08888273d295795_1`,
      headers: {
      "content-length": `17380`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "content-type": `text/plain;charset=UTF-8`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `empty`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      body: `-dYXJ6MgVAo2igitiwiKwXDXtRYofXM2iJiKpBi+AiCiU0hgrYzVniEiIrO0LigMJnioAnMiAdMauitABY6uBd4iwXTL4iKjhVYLi74JCNigRM+qYGzZ761iWaEmaspSDYiKgkp-+Y345KYIiXYiok-hY9+fXOjMffju+OSidYM-gYHYZ-CdF41ihfMTih$iMN6iKfMMVvaF5Xixih2niiSF36$64HHJAh+fihZFIo8f42nnXt4i11y6XojFF94tmmdVW4nVg17oAiMBUjD+ZgnitTJVHQMSMU6i+4n5BLuLXdM5QqvFylJDlYRIYJtdGeQOQ+JfLOYLGY7d5MC5D5uJsVLRiMVOpnW8UR90zRUwb3P93A8M0J3hNBBaMV0idvVfMX$f866huvgw$piVp2XdGhh5tsaI+4$hgl+XfwvJdlGETihi$+iAN6s9e852A0DaYimnpuqa4CWz1mKPgoL5gWRB6i2YIj2I7gFE7MNI4nqSVj-DXp7CmsB4GCoj1xyuM3Wh66aek6k$1sIahU10rVjj5i8R$nRNoTZeKF$LUeY+EJQ3tEWiWKMSAjrYQ0wdiX9NO4$69oeWrYK+vkoM8Utk6uJFz$KHNTz-ISJkqks1mzv1nsnyWM+aGt$fnVTZiM9Ou6Yx2nT8+X$fr1KfvUEshhBZW5Bb7BLhXMquV$dynqrLKtvMKR6epDnH1xD9CzPY9M6xTbBXtExon0tlt1dLMy4jprvUjKaMAM0RVzA0OMtpMFCeSMXoQOBUodIxYOz8ExMT-CbYdDBbCfQrEHQxX8OqsX1ifXXmofHsEVgs6zhYhMXO0-V2eQHx6ti-M--2qREiA3M+O0pjlXMYV2MfOstoKg$nuX4jyuK5iEqQdj8JDDinoQLCp1Ya$Vf+ff++sNjKtiAj8nYwwdVHf1B1iXX$MfUR31HfdnYU+wd-h2k6eHdyK+DK$pk3sC6n8j+$+DMMUTUBCyM3LB8VYiMzuo6OqGMlL$4X+YZK0Rn0XBl682wpfKQiz-3dCzO0hMU4fQZ8o2R$XVNKVS1fJfwzNQ4$AhjOz+NK73f+rQzgdmihz8Q8GM6$y61Y40zah$fVUYL66eDPZlH$x8Xh8XTEYHAN6+fha6VZKMPaf-o2YZ78kLHhMW+SYj6u2H1uyiDE6-Zn-1tCA-3-qhEz-oOZ5QZRNPDKhM8VUTiiYH8eYSAV1NdBWhA1Xw--J934Qz6bff3fxusiM14RiqQrfpNQ3oWNiDkdh4nj-K3ljidYeRQdHFjqa2sXOJxsCsJ2YA6eQPC6hf5aG72Ritu1HfuM6WMroQOp6Aa3MbptfTlmQKMFKTs6UrJGohGywbUZAbdh6fP9qpiwqt85xeq9OCa3--x6RDQTCyY804bh4b-Ft3Z$NQDo1T-E8$oNkCTEq7$-XY7aatl3TAGu4oaZZfCUjnsqy41gEUuQ8Gi+OfT6NGsCTn92q8Ys94CpWQTUoD99+wkrrsXV$LCTt3-X2iDL3MKTb-C54WoCDUYF-A0SGB4d6FWa0PiEHL6F+l2+Z6Jwoa2eYKf7SWrlZNBSo3sgSCCfLiFgfOdvRa0IMY+XForVbolii3ICfGpXZzXfii8LidM+Vxd4iiUg41wMeEsrYh41YK0OXp4yH9n1EM+hxkqmuY0GixMlZ4KGNqoTJM4AXN-VIMrUo4ibGETz6ohHnbUqDTMEsGR6MxAHWtuFWY$eItY6X40wLvakqkOXhdKiwhJwlDMGFlEM1LOl5LNV$h9f3LEnfio3XvV2CkhduiNdEVpHQ0Vv+$Qw+pv2hdPMZit5N--ofv6N6TOFz2IbQZ$$-oOBGnUkCBOHeN$8WKpf3iF+Fg+w2jAVMXiI$Zhd7iqBlw170AUUTVwUNV-wgKn5DpVO++hVFGfeHkBUJKGQO5mivONK2VFDW56VodVfD1waoXx4bhd6X6piwEieV26Mz0dIpfG$2jdp$TzT07n4EHF$JyRGqjjMdFpNQOA3z2K162jji8w2HuF+pW$Joow$3DpjP$7hbf8hXfnWjAB5tAWz-iKifeF2SIYu2M+RtZCKAIsXlrU+2OfmDdSjYbo3y-73YXWCGalXN4rJAAkzizhanLxBJxmZQY4Ozud+OdnzOy5X1Xj7oTUn8KLMMQdwT+GKDsoTP+hBy59WDSRlov8rQMIj8RLEDrU-9Tq7XOipHUYYNIQBeppzZuE-hnHo5at-4p5LQ0Iijjgh6ZX+XWrWVW48zUX5XCnHioDO2usGoezSff4rz$1wqPLnoKZ5Ml4k$2o0rYumjzEM$yxli1Ii8z1AoRax-jrERk$PK-IgPu4wCQtGDfaz685z4nQfY+FHIjzxt0oqa7M$6AJILVf575nmfXQNzs3rzHFVL-YdIjA5Jnfrgbd0qIapoznjbr-Fxa6haiisOPzx6HyJqCx0PSADbPv$qLDXE5G0WHevWKZxBe+wNv7UdzSEAXEtAweySyfIiO0JDURY4xL9H2vuIxSDs1xOmw47N1UEmiw1XRQfY9EUHn1Wu$SfaVwkrLQeBZXKgemSLdYi96UdpEpfigNArl$1eiJLYj4PzBd$i7L0NWfzOiHe2Qb-GQX4NGA-LbLWfuEjZ-OLGVv6rONMVuRv2YjitKeV5xfuKZ2wu0nD$FKFfhhh-zglWK8P1wzeIuRwqIIdX19p44GwKZ-7J-O0ZfM8-TBp-eH6yu7g2xw-GapesjxiiveWpfuKevFSxqSitKVwCS2-hzXpjiu6V++8P+BriiJ0djptrBi2ygUQhZfQi0eMUo5Myz5M3NMUVXxvoYptQFMQ9em-eIw5v6VOfGQUNiAOB$UjPmoWlD2oFIkf0UOaNM5QOZyql27oru$$-9ml4jtMklINL7eFbivTmX-HZTytpyIAwf5LDE9hezAofAiJ43Xbt$64RTotd4wWxnq$XhbgDRPelW0CQykvh1+pH8POb7ox729WdzTIvR7W3d+JSjwigbi80o2E8ROb0lqp3EENPAvQ0+rjSN-WNqjHyxMqHKw94CWyrn$JqG6Uj9tFsFpTGTPRD9Aqs7RzDOp4byKHwz9xgJIqahDwIbpgFsNpR2Pr7Lbr2nX2POpxnVSB2nQvLQv$9pxxTy6F5-t-eq9ioOOF$NothzH+Okdwohr9$wh-b$fdGsfiRfeYQpsbxF2ASCxbCwWKnYOr1OGiH8M0irUii5LFFpmwZiEM1pdLSmizQBEo0OLGrCsJzEdSUqMz6BA3YipLmFbJS6aDXxXwGh6IE4tZX0DE4GR04o9-TymjyGz6iGoT2RO8J0Or-zjt3XNbj6VAC0Y9fNU3F+G7D8PH$S6nO4+vn0CpL-C3MBLgIlBjdRs87rGsagQLOUVIK1J$zB4+oD4vgIwkDREEzv9QrJpRR0xPkEg-XhNUSe6aEjymwNZEeVVFARhuN+dSN-lqO5Bn9UIul5Xt-D-KUOXtKML5khyaoMlAiFkTffjJlOzVzkR5iZ5i7t07eGltiZXArDm155O5ZTP4idW4WozQIGi31iZQYu2IyhPQXwzfZMXdiR57mfdIluQVZQYNl52YsfVY7kXLZVz5jaDJH4iL7eX8fZ2tXZXIfZXdZWX0VfYQEffbgWp1-4duiFiX-ooOfbilz--afris-emONMi33+ilidOfwMixPY35ir0sfePUX70D0PlDXl7+T4ibh7PM09P-X4hiW5W+dVX2WKfVWtEIWJ0s0BWNNtEUYmWWWf0kBfYjYwWi-+Y$FiSeYBi$SiXO0ZiSSOeiLbSOY8Lzat0dSUxDODX8LEatLwSY0oOgLLoiL$o7OuY806oTzOYEiXQFFI940roQn5ijo-oMiX0Zip0OoM05i8C-ETQ0MIjVjMi8CuE40CkMiSCDCnQEQvCoCGYofid8irC-L80HaDQBiHaILZiHaULBdPaJEDXHatOndmaVONdPaJQ8iHaa7U080FRiYd+H0BiyP+u4i3RTRMisR5lKXZi2raRe+HxGXoiBiXu5iXuW7a+qi6JQ2YYaFtJe1hXoG40ZJOZ4iZJn+liqaoNa+wJUfzW7ZOYLm+ma+2mk+80pmtvoh5i60sXrmgUhmOLzf6XomAL80x7VwuwOYy4qwU1nwUJnfRXvOtq1dZ4wqubowQk7$zfdR+P4ipyG7WP5iLENEeOTEnEfds1AOI89tQ+6vtdH8qO5dRi6vGdli38XwY8E86vKLC8qOodx+6vUd6+wlUaDX3$lLU7f0sZnkgpUfS4HA98ZijA8wOYCA$7Qzh4liEAR4li94yq-wi49wawJNeA22Lke4x2vw5A8kn0FkTrtA3Yzis03id+SDk9NgAOVBWrofbDKf2f0gCK5tWtatgg6F4gXi3EtnIvImu$0VuDQqgfIHGguYg2dk7+Ev4fkvD$9glgPlN$8at0Md41YXpfCKDnAiGsi2hdTfUO4gxjNJQnnQ+WADn4ZQI0YzWFsXN$vAi2ez+fTyfV16Yz7UVKe8O0+E4f1iiiUwXvSrJhCYofIONTJtrjsRNh4CPTT42okiIhfi-MwVRR4adoeXYizt26DhdTwoXf6k0VHXJoyN2+8oPtNMwh8XAkVpGi1nra6iQAWyWCSBG8IVkXB$ICDNLooRlw$weVWRlyEBv5kngNz8+OkK2t$qQVHYIM$YQe8P$z+AdK+YAzAB8PMkdtrXw-QVr6U8AP8P8yGMkyb6DiNotM+M2+1opw2k0t2GAVLM4BdR2YYts45-QM5M6j3y$hSKyhopGoK5269p3jdO2LGBeObBuTYMjB2M0846pvpoFk48EGFA36wRyTNyKfrTy+1k+irOSBIMLrx5p875QLXatesCpVeM7CJ8Kyt$2Ki+6oiiA1rrH90tAnYMltXk2y80riAjUYxVrfWkVMqrltUCCy581hoT7$1ii+WxDxD6BGrasZ$T+J0k8KMVB8zJ$J0fQ0MVBBCsLJrSzwL0i0z1gYzLmGHwmxDjYdzWXKhXX$zRz8auAsmRiRh8aVreKy04X18MS07QIuKhzliFXgz4hbF$XFBVzSXG6SYIAv$xMmnVQoB5MrjFiB2Kh6Z9m1sYm8HRiB2XQkmjYIIIdx7LzLLFXqBRXA5sLBm3ooMQhiL-BlYkmlr3pTi5fmjlYiQ3KE$Jr2DSY2DA+MYGgSrLXO45f-BpJ9+W-DIS0HBk8PIWBjIW-t7rMyI0MC7ribDV4yXt7eVXDPQodKIVMm777nYyXGXnBRBRihFmmSXhJV5O4VTWKhiNzixq$JrkCYx0iXEMdR7HLpsLXzMiFt1fiJ4arp1hBy2QZsHOpKi5fxAPzW0KiDDRiAT0Qk8ps7HTnH1bQyBIi1Zt+UR1XuHWKGLGjVBNXIAOmd-Rix+O-rMaKnY3xT6mzTirEsHzJD8HERM5Q7i7dsEFibQJhNBjxfMsd-EvIDX-xzBnFjMBnUjsLGX3BdMSxQLoYDDRxoERMaxaBLi2iJEnZHQOxwE7EFMEx0MdKwxmxaXuxGxfMxzCivx2iUTuxnxviDQ0tYOGxRE17QL10y5it6xZMvE4MQtAE6xQOitNxnMZRrDUMYtCMpx5x41fiDBgpEHaDUjbMXdItp+oh+XbxIMNXoYP71H8a1dG$MsvjFiRQph5Q5XNQ0dWEBtCSriWEqzNHL-+BJrTO8fVHs8V0Ht0Z1gsOh41rRizQwLJPGLdhA7WYeOrPwMTihXnM9JFi-7p1IzdsJsrLQIfiBPv7uIn7O7FXoX3d7MwJdFpdB2HzKHIEUjE73ORDFhlD6XtM1d4E$hv6fiRQzM0woBufKQWdnJRifB1BKQw7DH+BAwKDqxZ6C+psFwaiKErdFHsLfB6BRXo+lQTiLIzyIy9i0ia2y7uz0iGXrs$SFMzwRXNybyJIewQEFXW0BzAwywNyUMbwkzKwRBRRfj+BuQU2WnXwQHQhBMgwjy+WdyY2Dn7IWsXy-ynjoXUguYW-PwSyZyfwdyA+JyUKGW3OoaQxItziHBnhpt+wxTRBRSfDVHux4x8xjwRDvyGXTPF$K7p1vwRB-p5PF$5ft0a8dQThLk+dwPkwvw5xDMfyzMANLd7ibxNDWKRYHI5LDYAkIwFksHLko7l+JyfkRXXQQAxEYn6LnNykLdziwDCxnNxQ7ioKLNNtO-QLnkiN22gkvwb7RDqkxkgkRBNkEmmznNCEDkvwVdwjqHULnk4ieNgoCihkaDkZYsUi7iERGLtLIHxH1QEmRiJNTZYCQsTxaX3tfitHg+TMV+X+ZMWrxTZ-e-lrP$yVkwFMZRQkxRsKsdyO7k1Q0bnppsfb6mEWLbV0IM1XCsXIxQtyM4fbOMZAHk$9ZACB5iQshivr7NtwrHBHOkRk4foBfnfMkQVd6d1sp1ktoh1V2yLmlYkt2wNy7ipdktEEWxjkFM-pPLrHsdMj615TSjSYoD-HV4WH60Z+61BjTbh9PH7S6jeyu7s9r9VQiBPbS9hb9MFXIwsbtr7iTi57ZbIRRKX9-EpRFjmwCwgwPddIW-Q9w9oyTk7bMpT9-EeX6MdxoQXeObeX67t8eB28WB0e6zDx$$oQZ8qyIP0eZZQk9+fGT98G-Sbix9ri2G-xgG$kFe$e6LAeT+8Nu08yHMlY8k1k3L4eA48e6LtGpk2e6LNGEmjt7MmypGqeKOsL8kQhMe3eee0iTe0dBeZ8oDam9pCM1HDGTMbibxsYVai9DxiGTwjG99RyBGazhQ8yqNIdgITF2NKQCKYBsLHBOY6$FERi7G6PlQO97HajCAdxMdOG3z779eveTLNOhHBHXdXQ-MLBNiVioKkea7iBiqjMxt5xYFALiGBdvGhE4bbMkiRNveRYHi+GGH9yR0v05N1MVeVqO2xzDkmeLd3YnB0D+XTmutOGFalQjiHbm0tLd2IdkGqFgIa-hn5Eob1$Nt++9Y1i2qMqro$5eHiHp1MIIEdDAsGpOehvDLWAHXxHxTZp-oZvxTt9Pq-q0klDsslYWqvb3H1q-qRvnz5EJvlDQeKoxvJqZZZhBge$OqOewq6HUb6MSvxf8kuq8kYn0j9q7qlqHBhMrV-Yq$WqtxyEuqHBqYYxfUfiQuvGdU8wCiJvxf9LUMdUFBduMvEm$UQU-vuqXD2QpurN4U-vzJL+VMxfQHmsXULuOqED$14hrMJDAn0MznMLGqEQXX5iwWuqM$jiCPYU2H3UUX3X2uHuLU-vU96LKutJzUEQVw6U-qgEtx7i2UPuEGfuzGaCiHuv4ylD74ouazaUWrA+auvvuqhJmiW0tU-MHvEuBU-uvwoiaMXGGGfuqrCiws5u7OYBuvwUUiWKIGfltukUGuuk5YFBlrfluv1kGiherNnUGuC76H$lVBFXR0qNWXZLglVmEqNu3uRT0uC2hJvi6UplfUnlAJDLWrz3ui9qxl5uRfsUGeI3g3gX+Xglfd1M0lvQCijiM37MYXRkr31iflAlVBX3ALslxTnDh+biATF8glAEgv-3zQHMxfW3a0Afo3HizB-l5MF0g3OXQvCkV-J3MdbMq3uiElTin8v02HXdE3dBFdNlDKCiglCrB1MF49BTklsz-526lWvCP9-o1-ZtkEJ1wGpJDlBXMxSeuqv0tplWPXJF1xBEZ3x0Kliqiw2nYh3d0oDtgi$XhvpxdUS1Ir1e9jfGyaPfYM$v4OzRkvQUSNI+EKSqWZSxzSbMu5eqvRZdO$SNUvi0jm+8sdvSO$vGe1iY-jKCfSUev7XaPZdOpomet9kXuEbSsQSZMkvfG$L-$Ozigz5wtfI-CtB2L6VZeQrOLKAOzMnxffkHoka4Oxoq4SNDX7YnqszfbM2X8eKfAXteVaMv9D0f-14+I+wIAC4+$E1BLr-gzvOntvG5Mm6iLBOG+XtpB9XtfYBvyTYk+ry7nfdBWZ7eK$K8ri0EzjWIKO+-enmAubaf5SH4BVET0pBztVLTUON7jY9bDR7Z-G1urk-nBA+IYM6tptKMIBkfHL48MxhSVwFBfRLQ8eV7ZoSygZ16-gZ8EPosx6KuiJaR$ByPVehforBT0uD7VSQA94f+4GK6mVGtM6TTGKo0t+FrzYiGQ5IBepr27NK0XdM4OqOj$v0zjUUBdrU+Fio+RJadgFAt7vV2BOCJr6fMFQ2LDXkdkQ1VY7MXCjF+Yz+QSNBtU-QTdYF$w2ABthBppC0ydTd8rh4ZrLPUKd5GNT+78SBB3AeeLiIXHPFbrYwC$p6vBpTITqYX4JJh+iGoCBJYvMBHb2iOdieU0BdtUr5iWMmitw+GvpYFIVC6XnLkdk4nU+OivnuieD-k+3X2Ah+dXYt+V9vQigBNstMS2-8AaDrqLB-hjeQMxilVDq1khkj9p8LxCrdi6aMyyppTj0En-j58TUO2V7r3Y3iW8TCh2Ha$mTk1GqVPh8Ch-lY0QBTA48W7C+uTeMuAK3Vv7uDXr31iwnDrGRK63LMeeHj3Cah1$ArDJ-Ihqrn1s6RT-XhANPVWm8MpqKQbA4P+Rhmf2yuft2UAoJOZ6v0MfsYgxp4V+WFrz8W25fo+ORTUrMegrmjMAs3YTF0dPInenForQHrkdOFe2BPJRCv0Zv42kNYJhuXn+rX7aq0t7+mCPrTXhXuKVj7ECNryd0A49iwOHCRruQCnhbGkOj6LTo9AFTqJvhyCKQzie+oxYpxy20dOdpYJtbh0GPSdsb12ChVWr7MOzsXIYGdibM$$l0d9+iO9b-T481dB0Ei6p01Ku6QKXj5VN0Ofyd1ZQaqUrwKi-DNAEgK+r$aft$QEiqqiOaYu29Ai7oqMDm1BB-yL7diRNNuOa+BYNMsiS0tVa5HyeRmtTDrW8odh4o07A1rKYS+QCeKOmyfXKL$2gUD+KDJ0yXlnTQk-M$yzasYezoBtG0uhgaDKHgGi7l960na1dW7gFG2M1+M2vVoEnpakO57hrJKH$j1UKAv+p1L+DmUJ6i+6QRWRYsGGFMi$VwTAMr8f3InOORXG2CzgFDWHX96yhBjbd2+9K+MxiJQZzhq7puXtp$ufUTfKiKvL$z+4WzTxyTZvstnwkAneMLsxVANzyjagevm50K4R1wfYIHqOenkL$xwYP1K-i1zUZAVD-a$Nf8$zgAex$WanBl42mj3Vfy-aBBl4FpDQhJCR1UHjf2I7-G+MqMX6iZIz5NJJDs1S+Y49goHynjFPrIiF1IT-iqwWCqMr40C25Y9HG1a0ld+HnQYisG1OqA8XxUYoNwfYK+6X1XCYXkXMaKQ-aofHVbq+F8jih+1e+zJUzPAlQrwItgLoB$xTU0sXOyCGZUHiF0iWMT258$SDHfSXBfDbew4S7+YObx-AJokiEOb1lxr4NyUDiEOyMqLVIIyI0ia10K4+0$Py5RYQiFR5+XAzThf5$aFpT+VlI1WJhzmZ5Z8vik5jBK1K2RDDo5YBPJO6z0Y-i17INoAiziF1rqldxNMWh37hArTq46BBWhCQmjC+A0VxG8JDwbpTtYVQbT6iZzV8rBjPTbNE-azGKLQw8ebT6+SDsWvD944x-EKwIn8kNXgvMmDhMnMp7KL9U0nQtimC0ish8Te1AfAj9foYez70MZMmdFAv$qgy6ik-LCdiGitX5peQMb$irRDoE4SC49n$8i-VCgFdtV9QMsX6Amg2Sq9GCLSpIye0sOy9AnzprtMnv+U45fO$02Z83SkH-Ge7X5HTx0F9qIAZNI3Ahs3RNmwq+9$x5Wsi-YYGvnGiyQoFnF0Uu28M$3VyMYi-q5h9OjWK7s+GIU5Peu$sDws4qAIOCGujQswsBGIUkateR9R+X7g94QQywy+P0hiQFMaqh6CfJELA4gGPGe6iAieDDFR4V464ThPTzr6-qWQZQOPSghK1MwvfhrsLJ83PuI37XvEjLJfdN0tBk$OX++JUsBvIUa3VCp2nS+mVwgVS1i4ZRyhviIUfE9QVVJBxxiPMaRTC1wpyh-agdJvafk2pti8FBu$Lzj7apNy0z-T4lC7x4JUsjgqBWYvx74X8h4mKBPG-4ktn3LD6vzY2-+MQJtqhg9q5JNDdxnIyNP+RYaOrsLJVXbvuT1d2qMLnhyjsQM79GqTvBHsFPTsGHOV4l0IiTXgK1gThmBny+ZVXrkX9V4HnlhW688fdHzDLaZ$8Frbn89$XhJF0Ql-MT6ON1Fngjs0GLWGGxjZnyBW1xyO3ozkMi2jsKeGPdC4j0HXK8+CbeH6xkpfkqO1XDWWMmBOMfHn8p6Gs+x5CJmBplguMLMb$Qna3Zj-zTEO1XadObVp3uoQYQizfpdep6uYOijn2i$KoO-KfM0q4O+wh5Peto7api4Y-ioENsDOA3B18jYJpENm4K8RNZVeZPg0i6RxfmPL2sX7q$m8rLCArysoNejPJMkk4CX5AVsi3rK+ignTatDqW26HX6K85hFI656LdMXzOqx-4zGsi8nhMnbs+$iiFOD6rTjQ8CgCYBn-w4mELoEfK5jOwCyMb530kmCmeH4k$2LW-Y0-ues5WKQ+e0+Uy-txBE6YKMi4fUtNH4yDji1+pa69OYpvf-H3iGMyfGQj-MVebzHSCQhZ5gzy+DimjWtixiiKNi3zxAJkNRC319XrfeZDCbdtezBMPf2JBh9-khiBM-zwZ5a8WND2Y+CzmvBxvVdtffZXe7ZDbbfaUm$MQImZ5zqCoYov5-5DHY+wKnemqxkdoMgQ6R5SnfiW7G1+8tmDTPFiTIPsiM0mNzT9$0SkBXDieMv1CLsIddtiosD8M2dPWohnGZZCpTiMud3F6bmVK5K6N0AdIKuM4C5Pxs5Ip2XlpbjY1t5BL31tK8J5XoXKAxR11mbxHSLObH-ehtXjaaaTsLUxpxjNHuB4pzZ3AuDtUfenMP-Fr41q2r5+MAWTxjx9F1nCOXx$MZw8fzffMlidRoDXx0PQUoiooJmBU1CVgpbRXn2gKsIX6U2$5ESPWQFt8fAEpDxKiY-jFStiPeVQ4WWQvL4-jqTmC8LMzU2W7CqiyXx4hx8pJFnwGmD$I0NMWAIOTHlN3Boq51+Vzrvyoj$p1kts1UMPSoqVN-3tECkVb25z-DtYyyRC0oqzOo5q4yER2KvJN3XEsDpgByTmv$$Iq-WF$a60i2hj0--gDaPWsp8Z1Ii+UdW2MHvAZ-BVZnyFR5K2XYICs-py98-KhYb3XP-BOACIDHgbZWJTYyXJjs14i377-q+OHakV4bBI0-+7uFVhmY9T7NiysKfKgJvr9TlYFNZp-RZkYMIGLgN98hmr0K1MYPDtXmkEMGxiA1PmZgxVRo8bjr8P3NSnVl9q5sIHXr4jmgXKYh7z4y$2QmWZPAibg7yDtZKP8+VVDr8xfbpNGrAj467BPTZiRkZ2yHPiDP$27zh3X08JI+tJgD7aG82iPIQDvO185job9ni7ixl1BVZ2SIVaW0vNzQAan3Hp79-Pb0MVangbGI8Zm4hmfvrq9+JzAbghm7gzpD8anYJtBE5rPUk-7w-LNrhuW$8bfxp-bF4saQMI9OBnb04qO7xtGOR71XOkA$2heM6Pf1BoI04OUMdm$$sBMOOf7aiemt7d1GIliM6+VMEB$+Nt6FoBP6Bd7xWXfof-KiBavznxvAMSyWPFHiA3i3Zofi7nf$QBrgQJTCYJvhRtCX8IL$HYJ2zkS1z5h1$Xih0Om4a8+KiWXOTnf$RaB+uA3N-TnPfDr5qBAkxQ7qLjZ1kLuliovZAEIrTlKaqyMag9x$bxOtFWf0oH6Nyv4Hjs$J9kKtj$XiZWlh49fdbnERmy5l4dmXG1T$oZD11$r-vZRo9KxBjx7DhX38r8sxASmngyQ$+rZKxTi1XDMY7LOOJD2QYg3N-Lk$xnWISm471NPbLrh-aMMIB5VZoWX5oTHF24feRV$VWxd4kf9v5XRfIGZAt5fig4Z$LBaWgF-gkdI-0OH1ifg8eaCOEqLy1gsTQUx676vyCSaWW3qFBB4mE7lXJeJUDouo+v9af4qsIFSWx0Xa4okdo3dZ1b2$HOBOKAxSluE-EkuEW8s3L0UNzIt4TfdeD+QLbHKfwi7+fMpiEKo$iYxwgrxHPaf+SDgm4FVddE-zK5sVpAoS+lQYkhk9xI8ozV705XDeM37qt1sT5IXCwZhdpo6fMhPOhHfftD4gM$PKE+oCbrt4z5OaKEtdGva2zEnaX0EMdXlIIAw2Uz6Wo+A0pG6+Bpm2Yg08TEddS27Wg+kC8U05ofT+xOvL4-BL-XHg+9gLISXPrSo-gunIb$SC1ApFNaDxoLQ8Gtt+8sh+2Op2SXdO0dS2-0rfC3HVOEotSabeVvEQ6i8N-HabV12wLhmGQpV2iJ+MlMVD+3+T3bVCtgGVF+CO0KY9Zb2ipOepw2NxNNzAGPm9o9PaVQEMeXo5GQ62$Llha2-tOhD-BLXar9yCjOAKxTj0l7hH7-KtC7Tzjmf2B8TrNSm4AI+VzU0RnbClTvsqLi4mFLTCbY-WV+uPCMtJ0MoU0bV0WJPEdAbp3bnwYgVj0loA4oFhN8AMJxGQ1XfY+v68QIpWXfP1Ku-ikd2xisP5JuaHXkdgxntP5VCLT8H$GERiwrS3h$7io31OUv1NBVv2pRx7hSo4qbaAiYetKrQ$KP+ufWB-XXhh6fQLKVUTG3a4aQYg0r7Ar-iX4hwDk+Z+QafQwYay4j+9LCgetO6H7BzzkL$S7QwmHhiaZygenDCayaA9QnM67HeiYGIq0I+32fVwgypSq$F1NHGeHFQiov+Cp4XJQoXKfSPMLngq2eAC+xC5bSfV0WKfjLNtDF7InTAEpmVj5apM4xkOMGNWC4fPV4$DTTEyy+jvFAB2xBtnyw45nv7AIL$GZYxxZkpUJAG+jGNWOYQFrPQW+g7-ROCF8DqW47WDL0GNTVJdl0brdIXN8Mqgf+AuTC3f+yOYB7eyUr++xOiophjoW+Zkr-RQtD6a$0yhD5ozAe05LVqzRAmQEztSflkTYpQ5MO5L+$X+utm7-wSP5aVL-V8$GOdH1aqmGUd$tyyEai9FIqO3+PCYK6-a8AYDSiw5KZDY$sbBObrSrdxk3ze7kUeIXAmwfBNsw8Qs+t1U2-a4MRtqv0uBZWt8hsvYhU7vkkzlQp$aFYhPMC6RxWIgr3+fogGFEJRrbftJ3+LC8X4fOCnSUu+uGJyuRPsvF8oOaR6iXJzYhJWqrtY9wGRAh0MuMupoD6WAnhzFbBgivikkaB8doDWXvo-ECZS3S3-ez9klTlRWZnjNdu4aL2P5enJZnU7Q-gzM5pAiADeNKzuTVX1Xgfhu9P1JTi5k-QomRTpI5Ki5bPk$Z4JRAspWHHTSsaK7JbUZmI6j3nPKDbVpN-JiZWbzHWbVkAWnEPf2lH7Pz2RFiPp8G4nmqapk2PhgqbakJPw0w6jiO-0O7elAeN0fi2wwvCPMC4RNoJk-6SiQLIMkBL05FYl9fZwurBLJooF-vqgjlXn+i6JtQyQ3BktLsz5lkMShL5ij3pY6unExIIdLY9aWRIRmj5nPxEvt5pTOu-OkreZW8WnkHtshQiNyTIR+dEiZUpYBgNml$IYG$hniTNPapXJnYpBvf0yurunuQiEAyPOIBymZhST7npDakpogsXF3AMtvEi6m2ZmI9$iSRzwGSZLs+wfUAapzamminLVkO8-CzoYDZr4x0Mg2qCCmSZrxsWgPGE-STRZxpuVGt5WLjmkZFDaSuAXS6i7UeL+aHCqvg-smefw8UTwTXNkrXg-6FVWYXTZAfmI-$ft1QgEA0qXY4Ba2JjnV$MnjkwWxK+ogfUY17wVgy9$tb2LSy2JfGbJs6+dF7Zjo7nQKW+lm2bzXj1fYsTOTmVi6JO0WyFUoyTtiq6Z0LNr6+U2GPK7wjPy8ureXuQExE-EztfA$qKMK7l-3sgmQrMLHTYHiU1AKj5qtm-WpJgBHm7gCuTo704Qb9V0SAZfHJw-9Ns7Q-PsBXL4T2X5$ZZLIb57JP0YtE79XAiZ7a8kKCmQS2y9Z7BmgBKf6C2+Wn+v09l$VTVo5MyjGDEjG4BCC$-$ECxyo+ZUGL9r0UbP9HB4+FQuMQ+K1YXAKJK7$j$E+6GQoht7Gj9ai5WCx2bUDOKb-JRDw5+9hUzT96E9W0bAHoBkh9$a0S$iAwWOqlaAt+SwpplYidRb+8N8brQWIxaKbBQXeWTKSokqisVEThseRl8nMGw3LNSwbCThibMiQ8RDRUFbULLtT$EZtXqxNrG2G9VraSBSvug0yWw6EhfOhoP+dOkWrE80KW14piuwoN4FSxQ+lU7epkyRf+lQA6QOqSbfECP0M9ixxX3k+OfS9xgbINeiG-nyqlWaX3PIgC$E8JKqskuDa59mBHoBjPbU7A0VdbWodqp0pZOp4aPGDqPCt6QUieoXfvDjP03aqhMSzFjXTREkQuvbnXfI8Tds0kE-yINC$NTF0EZ0wb8b7iMsk$0zMb27m+2Oa6vIJ9sE-pkXfi8ibTQeDCXxXMh6Z5H25J9+DCs6HQSrvepY+-CSXOQseXeGlRwpD7taLl-kyGXO0TppsPUNSYw2YelE7vrm6xIQhtH+aTfGA6YN1$o1NKr+ETb$7P0iBjqlh$7kbHTyeArYnnPi9gklTvhjsuzQRL90JOkZ+NZdodNqnnws6Xr7AqmCdJmsBXX$CCzBvho1jlAdznSfuQFZW39fW9usitu40VCQ809Pr$bwieem2$D4uh6ydHNur$fYtt9CsON6GLVGiTaz-vtHCmrTXIHRn6YvM6sYd8nfeDZjGteNtgpO1QUQM6891X04YXYspn1szkTaRjsZgG$BdnPQsXiMg7RbpY2ZCYri440jlklovBTQCutKLiWdNZ+0s$TiZ7n8yWL5SkkmJKVD2eWFQQ8Nl1CbrWS517IVoM+bDkmdvBd5ftaf-yLEEN2kBdijs0jKHiwzk3QNj0atOC6zthRJZtb1F1x8njTC4+XhpSDgdv+qaoY5x1EHuqwmevUhRCCIYoeS-KW$hUwnd5gA91qgmvtRyNqOXFt0CCHUGCIxsYC$qtm$TXIdTGnvWkRRSyeeIsCQ9JkzStZEHtWGfFskomRy+x3-ubvmkEmsSIuLKrbvkF7mP+zYoz6Si6JvnH9YQ3R1uP4SZXn-ZDrmb7ZQ9NYLr8CzQn+WZpeYBKqFbS2-wRQe7CroNQUDEX7h7DF+v+bJUjqv8TFeGvxp4M4k5E40thw7HtKoQWkm3558zxgIghb9kfaPp5bdhPqak3mm5FQ6OUNv-kv1znSb3ZJo5B9218W3is5x-iBzTpCfYXwSRtfniojOTeQB2tSYHFuFoFhfOBKl0-iRnftp9O4IYYbgCnVSSgG+H2iwjanM$1pXTDmTnwS-TUt0t-Ie$8dbJv3i0K9i4qUih1SfnbBkWsiaSr4Q3MkopV-PMkU6G3oS5Uzdw3a-ExtlFIhepk8G56GYVMEiFfUqdwMkZH8bfahaiGN5TDsQOkqfat4x-5xyYgffPXA4SE31OFCNBlrlgWbUClW$QlZLIACfULmrSxunfroP6TgHTM+3J8rGiwsTAoi5z8L6BJiJF-ZtSzN-pd5nTaSPO4FWMMbwgYIXmmKTCfXQvtHjoK2f1tU3G2w$BkUxKzTeo6CfVFhddKIwrTYffk1RHCRX+hGar4743sdYVUU7VtXUZJUND5EKnkDehsnjkT6rZ8$8$VFnMvV8$2uLkuVDVMmpxT55YIk0V+Ms2nj4K$0MRw$CKOTjsVvYadm8DRJ0JiHXskChinVhV$EmBJpYmSqH5dPUnvMayp3ZENMhuTpJOsU1RrzSZukZGkX7rjMEmzmJFvk6mR5Fm++idyOkChtrnLQC+jvj+e94Ino17T2j2dg7dylN3hXZ81+0Esq4v7k2WAn1MEjjxIisuD0yNJnnYMqS9U4$etNzobT1TwfHizBzJ08+nC3ranZzfVGSFnUFNUJah3Ex8OSXb61qAW0V+-4r9HYBz1peIwhTUoY3OqLXeIXXbUCyAeIz0oOpRprSniFu$zfwdSEyzCACiHGSOsdzK34lAXHGd7loEpi-WWv21WDMFHCtRXPgsJ$+0nQslGzqDoeG4qzuM6freUlGSKOdCqLwuyX2ZgkhlyNLzH7z3HMLtJkmWItPXsjn8x2iZFlUoMAtaEVFOZSI3vE2d49dzseC1IEzqj199b$6ZxlxQ7gnktPl5le3ji7Gqx-R7SJw5ymjdSKJWT4Fuxf48phdVBxOqKWgGzBao9Rstx$PC$gDfCkUby34Zu1YBe7B05wuW8iu0s52KzX6p1LS0BuXXJnBGWFTEWTXfgAmMUMIs5eJ7ItjIPmlmYXQMQOIyoWVyZKxyx3K4Wi1IfoDX4zpkJbaa3wBUgnJgfFi4d18aYImb1hwRRRzsp3PgXlSftIbjFKjfQ4qs-Jdj+o5o7pCNzMdMVWW6xVigvE6qjojlwSbiZt4w8ZzlM6-iY5lxCY1RyaySD0UQAjBZirnRBLxbyhu3O3MBXlulbkKyANeBS8fxNg+kr0xJLiuD5Xkl8eTmzgiAqFqdKe6DioXidtfi5fUiM5iAfDi+fMVXNihXM2iUiiUM4ioiMsM$ifLtXiAiNihfMQiMdtXi5fnLM0$D0tdMqMF+JiMhMFXAqpMi7XeFirii0MdoQVyfkIBmMSiVMCPM-N10MIdrXnfKRKm0e8OAD9ntgV4VyfU$OMXg8iiiKqLnfiIirX7MitrFLe8hoBvAUV4yXk0KHVeiV0tw84VN$GTw8o8ntaT2oFiG4iIM+iafYiina84YrTiafnNM-ix2ogVii7$8oGTAMBVoNXAMXiMnafKiFWXMK61DdnG4MLVtX7i+FoF+-q50M-iCziiT-i9ZwgfIitYebfuLgfOXHLiO$OXi9izLGgooIQfoSX$XjYe0iOiHHh-$Ige8+ShdYM0nkjF$-fKDBbia6MuMf8A7fXMCiyXhAoXXVXV1V9iR0eFVnlG0GpiiXritVofXp0OVo-ipYKsiQXqYJff0yubiIoQi5Yn0M8XRYepV3ikYGpo3XLLY-2SXALYzozXxQ-zVn-uQAeVOiyBorfKYe8+AiiiN6h2OivkohP6Qad-QiuXzQh0MnLhFO3V$RiQoPMziV6VQiSgaXhYLtXua8XoeJ+diuFulO2oX064e8MgWHtgj6TV-Kgejp2yf7+M5ivXpA+KofJQzopAk$uti1Mu+Op9T4-4e8OiL0iUVBFMB45$VwrMdKqh1$EfDVBITW8WVX$+2n-XOOSNfk6MIiVne8itMVfFk8IXyfTiV0MdnTiOXMdn5i+fM4iYdeXM$i1iiLoYioio+oD0ghO3-dreD+rfEfY$JLj10K+nIhL$a20dXdX14JTYhe+$JPinVONVTVY6nX$SSl-QpjwgPOMZwF8Ef5$MVS9HGzCgsR$I+G0iiiQBVfXjkAooBwi$iMXHvgMV6fL4noBO+iTfEwy0L-KUVjDids1T$4DMXiihFp0Lii`,
      replay: {
        id: `req_3`,
        recordingStartedAt: `2026-06-08T14:19:30.948Z`,
      },
    });
    k6Check(res3, {
      "launch - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('login', function () {
    const res1 = request('GET', `${env.baseUrl}/account/signonForm`, {
      name: `GET_signonForm_1`,
      headers: {
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "upgrade-insecure-requests": `1`,
      "sec-purpose": `prefetch`,
      "sec-speculation-tags": `"cf-speed-brain"`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      replay: {
        id: `req_4`,
        recordingStartedAt: `2026-06-08T14:19:51.021Z`,
      },
    });
    k6Check(res1, {
      "login - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/account/signonForm`, {
      name: `GET_signonForm_2`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_5`,
        recordingStartedAt: `2026-06-08T14:19:51.078Z`,
      },
    });
    k6Check(res2, {
      "login - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_2`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/account/signonForm`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_6`,
        recordingStartedAt: `2026-06-08T14:19:51.326Z`,
      },
    });
    k6Check(res3, {
      "login - status is 200": (r) => r.status === 200,
    });

    const res4 = request('POST', `${env.baseUrl}/account/signon`, {
      name: `POST_signon_1`,
      headers: {
      "content-length": `36`,
      "cache-control": `max-age=0`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "content-type": `application/x-www-form-urlencoded`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      origin: `${env.baseUrl}`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/account/signonForm`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      body: `referer=&username=j2ee&password=j2ee`,
      replay: {
        id: `req_7`,
        recordingStartedAt: `2026-06-08T14:19:55.029Z`,
      },
    });
    k6Check(res4, {
      "login - status is 302": (r) => r.status === 302,
    });

    const res5 = request('GET', `${env.baseUrl}/`, {
      name: `GET_root_2`,
      headers: {
      "cache-control": `max-age=0`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      referer: `${env.baseUrl}/account/signonForm`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_8`,
        recordingStartedAt: `2026-06-08T14:19:55.267Z`,
      },
    });
    k6Check(res5, {
      "login - status is 200": (r) => r.status === 200,
    });

    const res6 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_3`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_9`,
        recordingStartedAt: `2026-06-08T14:19:55.529Z`,
      },
    });
    k6Check(res6, {
      "login - status is 200": (r) => r.status === 200,
    });
  });

}

export function actionPhase(ctx) {
  transaction('select_dogs', function () {
    const res1 = request('GET', `${env.baseUrl}/categories/DOGS`, {
      name: `GET_DOGS_1`,
      headers: {
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "upgrade-insecure-requests": `1`,
      "sec-purpose": `prefetch`,
      "sec-speculation-tags": `"cf-speed-brain"`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      replay: {
        id: `req_10`,
        recordingStartedAt: `2026-06-08T14:20:28.644Z`,
      },
    });
    k6Check(res1, {
      "select_dogs - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/categories/DOGS`, {
      name: `GET_DOGS_2`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_11`,
        recordingStartedAt: `2026-06-08T14:20:28.702Z`,
      },
    });
    k6Check(res2, {
      "select_dogs - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_4`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/categories/DOGS`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_12`,
        recordingStartedAt: `2026-06-08T14:20:28.956Z`,
      },
    });
    k6Check(res3, {
      "select_dogs - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('select_dog_category', function () {
    const res1 = request('GET', `${env.baseUrl}/products/K9-BD-01`, {
      name: `GET_K9_BD_01_1`,
      headers: {
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "upgrade-insecure-requests": `1`,
      "sec-purpose": `prefetch`,
      "sec-speculation-tags": `"cf-speed-brain"`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/categories/DOGS`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      replay: {
        id: `req_13`,
        recordingStartedAt: `2026-06-08T14:20:52.621Z`,
      },
    });
    k6Check(res1, {
      "select_dog_category - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/products/K9-BD-01`, {
      name: `GET_K9_BD_01_2`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/categories/DOGS`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_14`,
        recordingStartedAt: `2026-06-08T14:20:52.673Z`,
      },
    });
    k6Check(res2, {
      "select_dog_category - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_5`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/products/K9-BD-01`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_15`,
        recordingStartedAt: `2026-06-08T14:20:52.953Z`,
      },
    });
    k6Check(res3, {
      "select_dog_category - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('add_to_cart', function () {
    const res1 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
      name: `GET_addItemToCart_1`,
      headers: {
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "upgrade-insecure-requests": `1`,
      "sec-purpose": `prefetch`,
      "sec-speculation-tags": `"cf-speed-brain"`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/products/K9-BD-01`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      replay: {
        id: `req_16`,
        recordingStartedAt: `2026-06-08T14:21:06.333Z`,
      },
    });
    k6Check(res1, {
      "add_to_cart - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
      name: `GET_addItemToCart_2`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/products/K9-BD-01`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_17`,
        recordingStartedAt: `2026-06-08T14:21:06.392Z`,
      },
    });
    k6Check(res2, {
      "add_to_cart - status is 302": (r) => r.status === 302,
    });

    const res3 = request('GET', `${env.baseUrl}/cart/viewCart`, {
      name: `GET_viewCart_1`,
      headers: {
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      referer: `${env.baseUrl}/products/K9-BD-01`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_18`,
        recordingStartedAt: `2026-06-08T14:21:06.582Z`,
      },
    });
    k6Check(res3, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_6`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/cart/viewCart`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_19`,
        recordingStartedAt: `2026-06-08T14:21:06.832Z`,
      },
    });
    k6Check(res4, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('proceed_to_checkout', function () {
    const res1 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
      name: `GET_newOrderForm_1`,
      headers: {
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "upgrade-insecure-requests": `1`,
      "sec-purpose": `prefetch`,
      "sec-speculation-tags": `"cf-speed-brain"`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "sec-fetch-site": `none`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/cart/viewCart`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=1, i`,
    },
      replay: {
        id: `req_20`,
        recordingStartedAt: `2026-06-08T14:21:23.398Z`,
      },
    });
    k6Check(res1, {
      "proceed_to_checkout - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
      name: `GET_newOrderForm_2`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/cart/viewCart`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_21`,
        recordingStartedAt: `2026-06-08T14:21:23.446Z`,
      },
    });
    k6Check(res2, {
      "proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_7`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/order/newOrderForm`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_22`,
        recordingStartedAt: `2026-06-08T14:21:23.695Z`,
      },
    });
    k6Check(res3, {
      "proceed_to_checkout - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_continue', function () {
    const res1 = request('POST', `${env.baseUrl}/order/newOrder`, {
      name: `POST_newOrder_1`,
      headers: {
      "content-length": `273`,
      "cache-control": `max-age=0`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "content-type": `application/x-www-form-urlencoded`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      origin: `${env.baseUrl}`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/order/newOrderForm`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      body: `paymentForm=true&billingForm=true&cardType=Visa&creditCard=999999999999999&expiryDate=12%2F2019&billToFirstName=irondjerwif&billToLastName=Gibson&billAddress1=6578%20Welch%20Canyon&billAddress2=New%20Address%202&billCity=North%20Jayneberg&billState=NJ&billZip=72670&billCountry=Benin`,
      replay: {
        id: `req_23`,
        recordingStartedAt: `2026-06-08T14:21:42.874Z`,
      },
    });
    k6Check(res1, {
      "click_continue - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_confirm', function () {
    const res1 = request('POST', `${env.baseUrl}/order/submitOrder`, {
      name: `POST_submitOrder_1`,
      headers: {
      "content-length": `14`,
      "cache-control": `max-age=0`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "content-type": `application/x-www-form-urlencoded`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      origin: `${env.baseUrl}`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/order/newOrder`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      body: `confirmed=true`,
      replay: {
        id: `req_24`,
        recordingStartedAt: `2026-06-08T14:21:59.722Z`,
      },
    });
    k6Check(res1, {
      "click_confirm - status is 302": (r) => r.status === 302,
    });

    const res2 = request('GET', `${env.baseUrl}/order/viewOrder?orderId=186000&submitted=true`, {
      name: `GET_viewOrder_1`,
      headers: {
      "cache-control": `max-age=0`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      referer: `${env.baseUrl}/order/newOrder`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_25`,
        recordingStartedAt: `2026-06-08T14:21:59.966Z`,
      },
    });
    k6Check(res2, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_8`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/order/viewOrder?orderId=186000&submitted=true`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_26`,
        recordingStartedAt: `2026-06-08T14:22:00.277Z`,
      },
    });
    k6Check(res3, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
  transaction('logout', function () {
    const res1 = request('GET', `${env.baseUrl}/account/signoff`, {
      name: `GET_signoff_1`,
      headers: {
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      referer: `${env.baseUrl}/order/viewOrder?orderId=186000&submitted=true`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_27`,
        recordingStartedAt: `2026-06-08T14:22:16.413Z`,
      },
    });
    k6Check(res1, {
      "logout - status is 302": (r) => r.status === 302,
    });

    const res2 = request('GET', `${env.baseUrl}/`, {
      name: `GET_root_3`,
      headers: {
      "upgrade-insecure-requests": `1`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `navigate`,
      "sec-fetch-user": `?1`,
      "sec-fetch-dest": `document`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      "sec-ch-ua-platform": `"Windows"`,
      referer: `${env.baseUrl}/order/viewOrder?orderId=186000&submitted=true`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=0, i`,
    },
      replay: {
        id: `req_28`,
        recordingStartedAt: `2026-06-08T14:22:16.604Z`,
      },
    });
    k6Check(res2, {
      "logout - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: `GET_speculation_9`,
      headers: {
      origin: `${env.baseUrl}`,
      "sec-ch-ua-platform": `"Windows"`,
      "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36`,
      "sec-ch-ua": `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"`,
      "sec-ch-ua-mobile": `?0`,
      accept: `*/*`,
      "sec-fetch-site": `same-origin`,
      "sec-fetch-mode": `cors`,
      "sec-fetch-dest": `speculationrules`,
      referer: `${env.baseUrl}/`,
      "accept-encoding": `gzip, deflate, br, zstd`,
      "accept-language": `en-US,en;q=0.9`,
      priority: `u=4, i`,
    },
      replay: {
        id: `req_29`,
        recordingStartedAt: `2026-06-08T14:22:16.861Z`,
      },
    });
    k6Check(res3, {
      "logout - status is 200": (r) => r.status === 200,
    });
  });

}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
