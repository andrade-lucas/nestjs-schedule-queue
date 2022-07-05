import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { Tweet } from '../entities/tweet.entity';

@Injectable()
export class TweetsCountService {
    private _limit: number = 10;
    
    constructor(
        @InjectModel(Tweet) private _tweetModel: typeof Tweet,
        @Inject(CACHE_MANAGER) private _cacheManager: Cache,
        @InjectQueue('emails') private _emailsQueue: Queue
    ) { }
    
    @Interval(5000)
    async countTweets() {
        console.log('Procurando tweets...');
        let offset = await this._cacheManager.get<number>('tweet-offset');
        console.log('First offset: ' + offset);
        offset = !offset ? 0 : offset;

        const tweets = await this._tweetModel.findAll({
            offset,
            limit: this._limit
        });

        console.log('offset: ' + offset);
        console.log(`Foram encontrados ${tweets.length} tweet(s)`);

        if (tweets.length === this._limit) {
            await this._cacheManager.set('tweet-offset', offset + this._limit, {
                ttl: 1 * 60 * 10,
            });
            console.log(`Achou + ${this._limit} tweets`);
            await this._emailsQueue.add(tweets.map(data => data.toJSON()));
        }
    }
}
