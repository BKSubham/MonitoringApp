using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using Newtonsoft.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
//[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace LambdaFunction
{
    public class Function
    {
        private readonly IAmazonS3 _s3Client;
        private readonly HttpClient _httpClient;
       

        public Function()
        {
            _s3Client = new AmazonS3Client();
            _httpClient = new HttpClient();
        }

        public async Task FunctionHandler(ILambdaContext context)
        {
            try
            {
                var request = new GetObjectRequest
                {
                    BucketName = "ManishaBucket",
                    Key = "website-list/websiteList.json"
                };

                using (var response = await _s3Client.GetObjectAsync(request))
                using (var responseStream = response.ResponseStream)
                {
                    // Read JSON content asynchronously
                    var jsonString = await new StreamReader(responseStream).ReadToEndAsync();

                    // Deserialize JSON content
                    var websites = JsonConvert.DeserializeObject<List<string>>(jsonString);


                    // Iterate through each URL and perform some action
                    foreach (var url in websites)
                    {
                        // Make HTTP request to each URL
                        var httpResponse = await _httpClient.GetAsync(url);
                        // Process the HTTP response as needed
                        Console.WriteLine($"URL: {url}, Status Code: {httpResponse.StatusCode}");

                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing website list: {ex.Message}");
                throw;
            }
        }
    }
}
