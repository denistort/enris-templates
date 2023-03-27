# Welcome to Enris Template

What is **Enris template**? Enris it is a simple nodejs templates engine which allows you insert the data into the html files

## How it works?

And so let's take a look at the code example and how it works in general.

1.  **First** of all you need to create Enris Templates instance

```typescript
const templater = new EnrisTemplates({ cache: true });
```

2. **Second** you need to create a folder with templates and create path to this folder and then init. So what happens when initialization occurs, but in fact everything is quite simple, all files are found and read, all files in the name that contain .layout.html and .base.html

```typescript
const viewsPath = join(__dirname, "../", "views");
await templater.init(viewsPath);
```

3. And so what is the difference between files with the extension base and layot. The main difference is that the base ones can be added to the layout. But it is worth remembering that if you add an include to the base template that will indicate itself, this will cause an error, because in the algorithm this causes an infinite loop.
   Lets see a simple example of layout

```html
<!DOCTYPE html>

<html lang="en">
	{{ @include $head }} <- here we include another base
	<body>
		{{ #if ($variable.length > 0) }} <- here is a example of if statement
		<div>Hello i am in the body of if statement</div>
		{{ #endif }} {{ #for (element in array) }}
		<div>{{ element }}</div>
		{{ #endfor }} {{ @include $wewe }}
		<h1>{{ $variable }}</h1>
		<- here is example of insert a primitive
		<h1>
			{{ @pipe.toUpperCase|toLowerCase|toUpperCase|toFirstUpper -> $variable }}
			= FirstUpper
		</h1>
		<- here is example of pipe
		<h1>{{ @pipe.toUpperCase -> $variable }} = UpperCase Text</h1>
		<h1>{{ $object.wewe }}</h1>
		<- here is example of nested data {{ @include $footer }}
	</body>
</html>
```

4. **Pipes** it is a simple that modify values and returns a new value. You can add pipe addPipe method

```typescript
templater.addPipe("toUpperCase", (v: string) => v.toUpperCase());

templater.addPipe("toLowerCase", (v: string) => v.toLowerCase());

templater.addPipe(
	"toFirstUpper",

	(v: string) => v.at(0)?.toLocaleUpperCase() + v.substring(1).toLowerCase()
);
```

5.**Render**. Simple method render a layout template, first argument is the name of layout, second argument data object

```typescript
templater.render("index", dataSecond);
```

6. **Caching**. Enris supports a caching

```typescript
//You can disable cache
const templater = new EnrisTemplates({ cache: false });
```
