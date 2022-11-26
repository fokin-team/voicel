import { Producer, Transport, Consumer } from 'mediasoup/node/lib/types';

export class Peer {
    public id: string;
    public name: string;
    public transports: Map<string, Transport> = new Map();
    public consumers: Map<string, Consumer> = new Map();
    public producers: Map<string, Producer> = new Map();

    /**
     * Конструктор
     * 
     * @param id уникальный идентификатор пира
     * @param name название пира
     */
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    /**
     * Добавить транспорт для пира
     * 
     * @param transport 
     */
    public addTransport(transport: Transport) {
        this.transports.set(transport.id, transport)
    }

    /**
     * Подключить пир к транспорту
     * 
     * @param transportId уникальный идетификатор транспорта
     * @param dtlsParameters параметры
     * @returns 
     */
    public async connectTransport(transportId: string, dtlsParameters) {
        if (!this.transports.has(transportId)) return

        await this.transports.get(transportId).connect({
            dtlsParameters: dtlsParameters
        })
    }

    /**
     * Создание продюсера для пира
     * 
     * @param producerTransportId 
     * @param rtpParameters 
     * @param kind 
     * @returns 
     */
    public async createProducer(producerTransportId: string, rtpParameters, kind) {
        let producer = await this.transports.get(producerTransportId).produce({
            kind,
            rtpParameters
        })

        this.producers.set(producer.id, producer)

        producer.on('transportclose', () => {
            producer.close()
            this.producers.delete(producer.id)
        })

        return producer
    }

    /**
     * Создание потребителя для пира
     * 
     * @param consumerTransportId 
     * @param producerId 
     * @param rtpCapabilities 
     * @returns 
     */
    public async createConsumer(consumerTransportId: string, producerId: string, rtpCapabilities) {
        let consumerTransport = this.transports.get(consumerTransportId);
        let consumer = null;

        try {
            consumer = await consumerTransport.consume({
                producerId: producerId,
                rtpCapabilities,
                paused: false //producer.kind === 'video',
            });
        } catch (error) {
            console.error('Consume failed', error);
            return;
        }

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            });
        }

        this.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => {
            this.consumers.delete(consumer.id)
        });

        return {
            consumer,
            params: {
                producerId: producerId,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        };
    }

    /**
     * Закрытие продюсера для пира
     * 
     * @param producerId уникальный идентификатор продюсера
     */
    public closeProducer(producerId: string) {
        try {
            this.producers.get(producerId).close();
        } catch (e) {
            console.warn(e);
        }

        this.producers.delete(producerId);
    }

    /**
     * Получить продюсера пира по уникальному идентификатору
     */
    public getProducer(producerId: string) {
        return this.producers.get(producerId);
    }

    /**
     * Закрыть пир
     */
    public close() {
        this.transports.forEach((transport) => transport.close());
    }

    /**
     * Удалить потребителя из пира
     * 
     * @param consumer_id 
     */
    public removeConsumer(consumerId) {
        this.consumers.delete(consumerId)
    }
}