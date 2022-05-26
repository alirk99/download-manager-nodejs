const fs = require('fs');
const { program } = require('commander');
const axios = require('axios');

program.command('d')
   .argument('<url>', 'url of file')
   .option('-s, --sections <sections>', 'parts to make','10')
   .option('-n, --name <name>', 'file name','file')
   .option('-to, --target <target>','folder to save file', './files')
   .action(async (url, options) => {
      console.log("actions running");
      const info = await axios.head(url)

      const length = info.headers['content-length']
      const ext = info.headers['content-type'].split('/')[1]
      
      const chunck = Math.floor(length/options.sections);
      let ranges = [[0, chunck]];
      
      console.log(length, ext);

      for(i = 1; i < options.sections; i++) {
         ranges.push([1+chunck*i, chunck*(i+1)]);
      };

      ranges[options.sections-1][1] = Number(length)-1;
      console.log(ranges);

      let requests = []

      for(i = 0; i < options.sections; i++) {
         requests[i] = axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
               range: `bytes=${ranges[i][0]}-${ranges[i][1]}`,
            }
         });
         console.log(`promise no: ${i}`)
      };

      console.log("Downloading files...")
      const start = Date.now();
      const files = await Promise.all(requests);

      const end = Date.now()

      console.log("Time elapsed:", end - start);

      
      for(i = 0; i < files.length; i++) {
         // console.log(`file no: ${i} =`, files[i]['headers']['content-range'])
         
         fs.appendFile(`./files/${options.name}.${ext}`, files[i].data, (err) => {
            if(err) console.log(err);
         })
      }

      console.log('Download Completed')
   });

program.parse();

