import {ArgumentsHost, Catch, ExceptionFilter, HttpException} from '@nestjs/common';
import {Response} from 'express';

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        if (exception instanceof HttpException) {
            const status = exception.getStatus();

            if (status == 404)
                response.status(status).send({
                    message: 'Not Found',
                    code: 'not_found',
                });
            else if (status == 500) {
                response.status(status).send({
                    message: 'An unhandled error occured. ' + exception.getResponse(),
                    code: 'generic_error',
                });
                console.log('Generic error: ', exception.getResponse());
            } else {
                response.status(status).send(
                    exception.getResponse() && (exception.getResponse() as any).statusCode
                        ? {
                              message: (exception.getResponse() as any).message || 'An exception occured',
                              code: (exception.getResponse() as any).message,
                          }
                        : exception.getResponse(),
                );
            }
        } else {
            response.status(500).send({
                message: 'An unhandled error occured',
                code: 'generic_error',
            });
            console.error('Generic error: ', exception.stack || exception.message);
        }
    }
}
