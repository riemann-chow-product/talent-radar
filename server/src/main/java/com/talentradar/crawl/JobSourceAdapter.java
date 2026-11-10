package com.talentradar.crawl;

import com.talentradar.entity.Job;
import com.talentradar.entity.Source;

import java.util.List;

/** 采集适配器：不同渠道的抓取逻辑可独立替换 */
public interface JobSourceAdapter {

    String mode();

    List<Job> fetch(Source source, int max);
}
